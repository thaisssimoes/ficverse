package comment

import (
	"errors"
	"strings"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrContentRequired = errors.New("content is required")
	ErrUnauthorized    = errors.New("unauthorized to delete this comment")
	ErrNotOwner        = errors.New("only the comment author can edit this comment")
)

// CommentService handles business logic for comments
type CommentService struct {
	repo *CommentRepository
}

// NewCommentService creates a new comment service
func NewCommentService(db *gorm.DB) *CommentService {
	return &CommentService{
		repo: NewCommentRepository(db),
	}
}

// CreateComment creates a new comment on a fanfic or chapter
func (s *CommentService) CreateComment(userID, fanficID int, chapterID *int, content string) (*models.Comment, error) {
	// Validate input
	if strings.TrimSpace(content) == "" {
		return nil, ErrContentRequired
	}

	comment := &models.Comment{
		UserID:    userID,
		FanficID:  fanficID,
		ChapterID: chapterID,
		Content:   strings.TrimSpace(content),
	}

	if err := s.repo.Create(comment); err != nil {
		return nil, err
	}

	// Reload with user data
	return s.repo.GetByID(comment.ID)
}

// DeleteComment deletes a comment if user is authorized
func (s *CommentService) DeleteComment(commentID, userID, fanficAuthorID int) error {
	// Get comment
	comment, err := s.repo.GetByID(commentID)
	if err != nil {
		return err
	}

	// Check authorization: user must be comment author or fanfic owner
	if comment.UserID != userID && fanficAuthorID != userID {
		return ErrUnauthorized
	}

	return s.repo.Delete(commentID)
}

// ListFanficComments retrieves all comments for a fanfic
func (s *CommentService) ListFanficComments(fanficID int) ([]models.Comment, error) {
	return s.repo.GetByFanficID(fanficID)
}

// ListChapterComments retrieves all comments for a chapter
func (s *CommentService) ListChapterComments(chapterID int) ([]models.Comment, error) {
	return s.repo.GetByChapterID(chapterID)
}

// UpdateComment edits the content of a comment; only the original author can do this
func (s *CommentService) UpdateComment(commentID, userID int, content string) (*models.Comment, error) {
	if strings.TrimSpace(content) == "" {
		return nil, ErrContentRequired
	}
	c, err := s.repo.GetByID(commentID)
	if err != nil {
		return nil, err
	}
	if c.UserID != userID {
		return nil, ErrNotOwner
	}
	return s.repo.Update(commentID, strings.TrimSpace(content))
}

// GetComment retrieves a comment by ID
func (s *CommentService) GetComment(commentID int) (*models.Comment, error) {
	return s.repo.GetByID(commentID)
}
