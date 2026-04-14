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
	ErrReasonRequired  = errors.New("reason is required")
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

// CreateComment creates a new top-level comment on a fanfic or chapter.
// Pass parentID != nil to criar uma resposta a outro comentário.
func (s *CommentService) CreateComment(userID, fanficID int, chapterID *int, parentID *int, content string) (*models.Comment, error) {
	if strings.TrimSpace(content) == "" {
		return nil, ErrContentRequired
	}

	comment := &models.Comment{
		UserID:    userID,
		FanficID:  fanficID,
		ChapterID: chapterID,
		ParentID:  parentID,
		Content:   strings.TrimSpace(content),
	}

	if err := s.repo.Create(comment); err != nil {
		return nil, err
	}

	return s.repo.GetByID(comment.ID)
}

// DeleteComment deletes a comment if user is authorized
func (s *CommentService) DeleteComment(commentID, userID, fanficAuthorID int) error {
	comment, err := s.repo.GetByID(commentID)
	if err != nil {
		return err
	}
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

// ToggleLike alterna o like do usuário num comentário.
// Retorna o novo estado (liked) e a contagem atualizada.
func (s *CommentService) ToggleLike(userID, commentID int) (liked bool, count int, err error) {
	// Verifica se o comentário existe
	if _, err = s.repo.GetByID(commentID); err != nil {
		return false, 0, err
	}
	return s.repo.ToggleLike(userID, commentID)
}

// EnrichWithLikes popula LikedByMe em cada comentário para um usuário específico.
func (s *CommentService) EnrichWithLikes(userID int, comments []models.Comment) ([]models.Comment, error) {
	ids := make([]int, len(comments))
	for i, c := range comments {
		ids[i] = c.ID
	}
	likedIDs, err := s.repo.LikedIDsByUser(userID, ids)
	if err != nil {
		return comments, err
	}
	likedSet := make(map[int]bool, len(likedIDs))
	for _, id := range likedIDs {
		likedSet[id] = true
	}
	for i := range comments {
		comments[i].LikedByMe = likedSet[comments[i].ID]
	}
	return comments, nil
}

// ReportComment registra uma denúncia de um usuário para um comentário.
func (s *CommentService) ReportComment(userID, commentID int, reason string) error {
	if strings.TrimSpace(reason) == "" {
		return ErrReasonRequired
	}
	if _, err := s.repo.GetByID(commentID); err != nil {
		return err
	}
	return s.repo.CreateReport(userID, commentID, strings.TrimSpace(reason))
}
