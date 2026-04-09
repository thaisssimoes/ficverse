package fanfic

import (
	"errors"
	"strings"
	"time"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrTitleRequired    = errors.New("title is required")
	ErrSynopsisRequired = errors.New("synopsis is required")
	ErrCategoryRequired = errors.New("category is required")
	ErrInvalidCategory  = errors.New("invalid category: must be one of the predefined categories")
	ErrInvalidAuthor    = errors.New("invalid author ID")
	ErrPublishValidation = errors.New("cannot publish: title and synopsis are required")
)

// FanficService handles business logic for fanfics
type FanficService struct {
	repo *FanficRepository
}

// NewFanficService creates a new fanfic service
func NewFanficService(db *gorm.DB) *FanficService {
	return &FanficService{
		repo: NewFanficRepository(db),
	}
}

// CreateFanfic creates a new fanfic with validation
func (s *FanficService) CreateFanfic(authorID int, title, synopsis, disclaimer, category string, coverFilename string, coverData []byte, interactiveMode bool, isDraft *bool, isAdultContent bool, triggerWarnings string) (*models.Fanfic, error) {
	// Validate input
	if err := s.validateFanficInput(title, synopsis, category); err != nil {
		return nil, err
	}

	if authorID <= 0 {
		return nil, ErrInvalidAuthor
	}

	// Handle cover image upload if provided
	var coverURL string
	var err error
	if len(coverData) > 0 && coverFilename != "" {
		coverURL, err = s.repo.SaveCoverImage(coverFilename, coverData)
		if err != nil {
			return nil, err
		}
	}

	// Determine draft status (default to true if not specified)
	draftStatus := true
	if isDraft != nil {
		draftStatus = *isDraft
	}

	// Create fanfic
	fanfic := &models.Fanfic{
		AuthorID:        authorID,
		Title:           strings.TrimSpace(title),
		Synopsis:        strings.TrimSpace(synopsis),
		Disclaimer:      strings.TrimSpace(disclaimer),
		Category:        strings.TrimSpace(category),
		CoverURL:        coverURL,
		InteractiveMode: interactiveMode,
		IsDraft:         draftStatus,
		IsAdultContent:  isAdultContent,
		TriggerWarnings: strings.TrimSpace(triggerWarnings),
	}

	// Set published_at if not a draft
	if !draftStatus {
		now := time.Now()
		fanfic.PublishedAt = &now
	}

	if err := s.repo.Create(fanfic); err != nil {
		// Clean up uploaded image if fanfic creation fails
		if coverURL != "" {
			_ = s.repo.DeleteCoverImage(coverURL)
		}
		return nil, err
	}

	return fanfic, nil
}

// UpdateFanfic updates fanfic metadata
func (s *FanficService) UpdateFanfic(fanficID, authorID int, title, synopsis, disclaimer, category string, coverURL string, interactiveMode *bool, isAdultContent *bool, triggerWarnings string) (*models.Fanfic, error) {
	// Get existing fanfic
	fanfic, err := s.repo.GetByID(fanficID)
	if err != nil {
		return nil, err
	}

	// Check authorization
	if fanfic.AuthorID != authorID {
		return nil, ErrUnauthorized
	}

	// Validate input if provided
	if title != "" {
		if strings.TrimSpace(title) == "" {
			return nil, ErrTitleRequired
		}
		fanfic.Title = strings.TrimSpace(title)
	}

	if synopsis != "" {
		if strings.TrimSpace(synopsis) == "" {
			return nil, ErrSynopsisRequired
		}
		fanfic.Synopsis = strings.TrimSpace(synopsis)
	}

	if disclaimer != "" {
		fanfic.Disclaimer = strings.TrimSpace(disclaimer)
	}

	if category != "" {
		if strings.TrimSpace(category) == "" {
			return nil, ErrCategoryRequired
		}
		if !models.IsValidCategory(strings.TrimSpace(category)) {
			return nil, ErrInvalidCategory
		}
		fanfic.Category = strings.TrimSpace(category)
	}

	// Capa enviada como URL (já salva via /upload/cover)
	if coverURL != "" {
		fanfic.CoverURL = coverURL
	}

	if interactiveMode != nil {
		fanfic.InteractiveMode = *interactiveMode
	}

	if isAdultContent != nil {
		fanfic.IsAdultContent = *isAdultContent
	}

	if triggerWarnings != "" {
		fanfic.TriggerWarnings = strings.TrimSpace(triggerWarnings)
	}

	if err := s.repo.Update(fanfic); err != nil {
		return nil, err
	}

	return fanfic, nil
}

// DeleteFanfic deletes a fanfic
func (s *FanficService) DeleteFanfic(fanficID, authorID int) error {
	// Get existing fanfic
	fanfic, err := s.repo.GetByID(fanficID)
	if err != nil {
		return err
	}

	// Check authorization
	if fanfic.AuthorID != authorID {
		return ErrUnauthorized
	}

	// Delete cover image if exists
	if fanfic.CoverURL != "" {
		_ = s.repo.DeleteCoverImage(fanfic.CoverURL)
	}

	// Delete fanfic
	return s.repo.Delete(fanficID)
}

// PublishFanfic publishes a draft fanfic
func (s *FanficService) PublishFanfic(fanficID, authorID int) error {
	// Get existing fanfic
	fanfic, err := s.repo.GetByID(fanficID)
	if err != nil {
		return err
	}

	// Check authorization
	if fanfic.AuthorID != authorID {
		return ErrUnauthorized
	}

	// Validate required fields for publication
	if strings.TrimSpace(fanfic.Title) == "" || strings.TrimSpace(fanfic.Synopsis) == "" {
		return ErrPublishValidation
	}

	// Set publication status
	now := time.Now()
	fanfic.IsDraft = false
	fanfic.PublishedAt = &now

	// Update fanfic
	return s.repo.Update(fanfic)
}

// UnpublishFanfic unpublishes a published fanfic (returns it to draft mode)
func (s *FanficService) UnpublishFanfic(fanficID, authorID int) error {
	// Get existing fanfic
	fanfic, err := s.repo.GetByID(fanficID)
	if err != nil {
		return err
	}

	// Check authorization
	if fanfic.AuthorID != authorID {
		return ErrUnauthorized
	}

	// Set to draft mode
	fanfic.IsDraft = true

	// Update fanfic
	return s.repo.Update(fanfic)
}

// UpdateAdultContentFlag updates the adult content flag for a fanfic
func (s *FanficService) UpdateAdultContentFlag(fanficID, authorID int, isAdultContent bool) error {
	// Get existing fanfic
	fanfic, err := s.repo.GetByID(fanficID)
	if err != nil {
		return err
	}

	// Check authorization
	if fanfic.AuthorID != authorID {
		return ErrUnauthorized
	}

	// Update adult content flag
	fanfic.IsAdultContent = isAdultContent

	// Update fanfic
	return s.repo.Update(fanfic)
}

// UpdateTriggerWarnings updates the trigger warnings for a fanfic
func (s *FanficService) UpdateTriggerWarnings(fanficID, authorID int, triggerWarnings string) error {
	// Get existing fanfic
	fanfic, err := s.repo.GetByID(fanficID)
	if err != nil {
		return err
	}

	// Check authorization
	if fanfic.AuthorID != authorID {
		return ErrUnauthorized
	}

	// Update trigger warnings
	fanfic.TriggerWarnings = strings.TrimSpace(triggerWarnings)

	// Update fanfic
	return s.repo.Update(fanfic)
}

// GetFanfic retrieves a fanfic by ID
func (s *FanficService) GetFanfic(fanficID int) (*models.Fanfic, error) {
	return s.repo.GetByID(fanficID)
}

// ListFanficsByCategory retrieves all fanfics grouped by category
func (s *FanficService) ListFanficsByCategory() (map[string][]models.Fanfic, error) {
	// Get all fanfics
	fanfics, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	// Group by category
	fanficsByCategory := make(map[string][]models.Fanfic)
	for _, fanfic := range fanfics {
		fanficsByCategory[fanfic.Category] = append(fanficsByCategory[fanfic.Category], fanfic)
	}

	return fanficsByCategory, nil
}

// GetAuthorFanfics retrieves all fanfics by a specific author with optional draft filtering
func (s *FanficService) GetAuthorFanfics(authorID int, includeDrafts bool) ([]models.Fanfic, error) {
	return s.repo.GetByAuthorIDWithDraftFilter(authorID, includeDrafts)
}

// SearchFanfics searches for fanfics by title
func (s *FanficService) SearchFanfics(query string, limit int) ([]models.Fanfic, error) {
	if strings.TrimSpace(query) == "" {
		return []models.Fanfic{}, nil
	}
	
	if limit <= 0 {
		limit = 10 // Default limit
	}
	
	return s.repo.SearchByTitle(query, limit)
}

// GetFeaturedFanfics retrieves featured fanfics for the hero section
func (s *FanficService) GetFeaturedFanfics(limit int) ([]models.Fanfic, error) {
	if limit <= 0 {
		limit = 5 // Default to 5 featured fanfics
	}
	
	return s.repo.GetFeatured(limit)
}

// GetTrendingFanfics retrieves trending fanfics with optional category filter
func (s *FanficService) GetTrendingFanfics(category string, limit int) ([]models.Fanfic, error) {
	if limit <= 0 {
		limit = 12 // Default to 12 trending fanfics
	}
	
	if strings.TrimSpace(category) == "" || strings.ToLower(category) == "todos" {
		// Get all trending fanfics
		return s.repo.GetTrending(limit)
	}
	
	// Get trending fanfics filtered by category
	return s.repo.GetTrendingByCategory(category, limit)
}

// validateFanficInput validates fanfic input data
func (s *FanficService) validateFanficInput(title, synopsis, category string) error {
	if strings.TrimSpace(title) == "" {
		return ErrTitleRequired
	}

	if strings.TrimSpace(synopsis) == "" {
		return ErrSynopsisRequired
	}

	if strings.TrimSpace(category) == "" {
		return ErrCategoryRequired
	}

	// Validate category is one of the predefined categories
	if !models.IsValidCategory(strings.TrimSpace(category)) {
		return ErrInvalidCategory
	}

	return nil
}
