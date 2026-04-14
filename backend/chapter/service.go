package chapter

import (
	"errors"
	"strings"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrTitleRequired   = errors.New("title is required")
	ErrContentRequired = errors.New("content is required")
	ErrInvalidFanfic   = errors.New("invalid fanfic ID")
)

// ChapterService handles business logic for chapters
type ChapterService struct {
	repo *ChapterRepository
	db   *gorm.DB
}

// NewChapterService creates a new chapter service
func NewChapterService(db *gorm.DB) *ChapterService {
	return &ChapterService{
		repo: NewChapterRepository(db),
		db:   db,
	}
}

// CreateChapter creates a new chapter with automatic ordering and optional draft status
func (s *ChapterService) CreateChapter(fanficID int, title, content string, isDraft bool) (*models.Chapter, error) {
	// Validate input
	if err := s.validateChapterInput(title, content); err != nil {
		return nil, err
	}

	if fanficID <= 0 {
		return nil, ErrInvalidFanfic
	}

	// Get the next order number
	maxOrder, err := s.repo.GetMaxOrder(fanficID)
	if err != nil {
		return nil, err
	}

	// Create chapter
	chapter := &models.Chapter{
		FanficID: fanficID,
		Title:    strings.TrimSpace(title),
		Content:  strings.TrimSpace(content),
		Order:    maxOrder + 1,
		IsDraft:  isDraft,
	}

	if err := s.repo.Create(chapter); err != nil {
		return nil, err
	}

	return chapter, nil
}

// UpdateChapter updates chapter title, content, and draft status, preserving ID and order
func (s *ChapterService) UpdateChapter(chapterID int, title, content string, isDraft *bool) (*models.Chapter, error) {
	// Get existing chapter
	chapter, err := s.repo.GetByID(chapterID)
	if err != nil {
		return nil, err
	}

	// Validate and update fields if provided
	if title != "" {
		if strings.TrimSpace(title) == "" {
			return nil, ErrTitleRequired
		}
		chapter.Title = strings.TrimSpace(title)
	}

	if content != "" {
		if strings.TrimSpace(content) == "" {
			return nil, ErrContentRequired
		}
		chapter.Content = strings.TrimSpace(content)
	}

	// Update draft status if provided
	if isDraft != nil {
		chapter.IsDraft = *isDraft
	}

	// Update chapter
	if err := s.repo.Update(chapter); err != nil {
		return nil, err
	}

	return chapter, nil
}

// DeleteChapter deletes a chapter and adjusts ordering of remaining chapters
func (s *ChapterService) DeleteChapter(chapterID int) error {
	// Get the chapter to be deleted
	chapter, err := s.repo.GetByID(chapterID)
	if err != nil {
		return err
	}

	// Use transaction to ensure atomicity
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Create a new repository with the transaction db
		txRepo := NewChapterRepository(tx)
		
		// Delete the chapter
		if err := txRepo.Delete(chapterID); err != nil {
			return err
		}

		// Adjust orders of remaining chapters
		if err := txRepo.UpdateOrdersAfterDelete(chapter.FanficID, chapter.Order); err != nil {
			return err
		}

		return nil
	})
}

// PublishChapter publishes a draft chapter by setting is_draft to false
func (s *ChapterService) PublishChapter(chapterID int) error {
	// Get existing chapter
	chapter, err := s.repo.GetByID(chapterID)
	if err != nil {
		return err
	}

	// Set to published mode
	chapter.IsDraft = false

	// Update chapter
	return s.repo.Update(chapter)
}

// ReorderChapters updates the order of chapters based on a new sequence
func (s *ChapterService) ReorderChapters(fanficID int, chapterIDs []int) error {
	if fanficID <= 0 {
		return ErrInvalidFanfic
	}

	if len(chapterIDs) == 0 {
		return nil // Nothing to reorder
	}

	// Get all chapters for the fanfic to validate
	chapters, err := s.repo.GetByFanficID(fanficID)
	if err != nil {
		return err
	}

	// Validate that all chapter IDs belong to this fanfic
	chapterMap := make(map[int]bool)
	for _, ch := range chapters {
		chapterMap[ch.ID] = true
	}

	for _, id := range chapterIDs {
		if !chapterMap[id] {
			return ErrChapterNotFound
		}
	}

	// Validate that we have all chapters
	if len(chapterIDs) != len(chapters) {
		return errors.New("chapter IDs count mismatch")
	}

	// Use transaction to update all orders atomically
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Create a new repository with the transaction db
		txRepo := NewChapterRepository(tx)
		
		for i, chapterID := range chapterIDs {
			newOrder := i + 1 // Orders start from 1
			if err := txRepo.UpdateOrder(chapterID, newOrder); err != nil {
				return err
			}
		}
		return nil
	})
}

// GetChapter retrieves a chapter by ID with draft status filtering based on authorization
// If the chapter is a draft, it will only be returned if the requesting user is the fanfic author
// userID of 0 means no user is authenticated (public access)
func (s *ChapterService) GetChapter(chapterID int, userID int) (*models.Chapter, error) {
	// Get chapter with fanfic preloaded to check authorization
	chapter, err := s.repo.GetByIDWithFanfic(chapterID)
	if err != nil {
		return nil, err
	}

	// If chapter is a draft, check authorization
	if chapter.IsDraft {
		// If no user is authenticated or user is not the author, hide the draft chapter
		if userID == 0 || chapter.Fanfic.AuthorID != userID {
			return nil, ErrChapterNotFound
		}
	}

	return chapter, nil
}

// ListChapters retrieves all chapters for a fanfic in order, filtering drafts based on authorization
// If userID is 0 or doesn't match the fanfic author, draft chapters are excluded
func (s *ChapterService) ListChapters(fanficID int, userID int) ([]models.Chapter, error) {
	chapters, err := s.repo.GetByFanficID(fanficID)
	if err != nil {
		return nil, err
	}

	// If no chapters, return empty list
	if len(chapters) == 0 {
		return chapters, nil
	}

	// Get the fanfic to check authorization
	// We can get it from the first chapter's FanficID
	var fanfic models.Fanfic
	if err := s.db.First(&fanfic, fanficID).Error; err != nil {
		return nil, err
	}

	// Filter out draft chapters if user is not the author
	isAuthor := userID != 0 && fanfic.AuthorID == userID
	if !isAuthor {
		filteredChapters := make([]models.Chapter, 0)
		for _, chapter := range chapters {
			if !chapter.IsDraft {
				filteredChapters = append(filteredChapters, chapter)
			}
		}
		return filteredChapters, nil
	}

	return chapters, nil
}

// IncrementViews incrementa as views de um capítulo.
func (s *ChapterService) IncrementViews(chapterID int) error {
	return s.repo.IncrementViews(chapterID)
}

// ToggleLike alterna o like do usuário num capítulo.
func (s *ChapterService) ToggleLike(userID, chapterID int) (liked bool, count int, err error) {
	if _, err = s.repo.GetByID(chapterID); err != nil {
		return false, 0, err
	}
	return s.repo.ToggleLike(userID, chapterID)
}

// EnrichWithLikes popula LikedByMe em cada capítulo para um usuário específico.
func (s *ChapterService) EnrichWithLikes(userID int, chapters []models.Chapter) ([]models.Chapter, error) {
	ids := make([]int, len(chapters))
	for i, c := range chapters {
		ids[i] = c.ID
	}
	likedIDs, err := s.repo.LikedIDsByUser(userID, ids)
	if err != nil {
		return chapters, err
	}
	likedSet := make(map[int]bool, len(likedIDs))
	for _, id := range likedIDs {
		likedSet[id] = true
	}
	for i := range chapters {
		chapters[i].LikedByMe = likedSet[chapters[i].ID]
	}
	return chapters, nil
}

// validateChapterInput validates chapter input data
func (s *ChapterService) validateChapterInput(title, content string) error {
	if strings.TrimSpace(title) == "" {
		return ErrTitleRequired
	}

	if strings.TrimSpace(content) == "" {
		return ErrContentRequired
	}

	return nil
}
