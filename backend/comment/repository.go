package comment

import (
	"errors"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrCommentNotFound = errors.New("comment not found")
	ErrAlreadyLiked    = errors.New("comment already liked")
	ErrAlreadyReported = errors.New("comment already reported")
)

// CommentRepository handles database operations for comments
type CommentRepository struct {
	db *gorm.DB
}

// NewCommentRepository creates a new comment repository
func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

// Create creates a new comment
func (r *CommentRepository) Create(comment *models.Comment) error {
	return r.db.Create(comment).Error
}

// GetByID retrieves a comment by ID
func (r *CommentRepository) GetByID(id int) (*models.Comment, error) {
	var comment models.Comment
	err := r.db.Preload("User").First(&comment, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCommentNotFound
		}
		return nil, err
	}
	return &comment, nil
}

// GetByFanficID retrieves all comments for a fanfic (top-level + replies)
func (r *CommentRepository) GetByFanficID(fanficID int) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.Where("fanfic_id = ?", fanficID).
		Preload("User").
		Order("created_at ASC").
		Find(&comments).Error
	return comments, err
}

// GetByChapterID retrieves all comments for a chapter (top-level + replies)
func (r *CommentRepository) GetByChapterID(chapterID int) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.Where("chapter_id = ?", chapterID).
		Preload("User").
		Order("created_at ASC").
		Find(&comments).Error
	return comments, err
}

// Update updates the content of a comment and marks it as edited
func (r *CommentRepository) Update(id int, content string) (*models.Comment, error) {
	if err := r.db.Model(&models.Comment{}).Where("id = ?", id).Updates(map[string]interface{}{
		"content": content,
		"edited":  true,
	}).Error; err != nil {
		return nil, err
	}
	return r.GetByID(id)
}

// Delete deletes a comment
func (r *CommentRepository) Delete(id int) error {
	return r.db.Delete(&models.Comment{}, id).Error
}

// ToggleLike insere ou remove um like; retorna (liked, newCount, error).
// Usa INSERT ... ON CONFLICT para evitar race conditions.
func (r *CommentRepository) ToggleLike(userID, commentID int) (liked bool, newCount int, err error) {
	// Tenta inserir; se já existir, deleta (toggle).
	like := models.CommentLike{UserID: userID, CommentID: commentID}

	var existing models.CommentLike
	findErr := r.db.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&existing).Error

	if findErr == nil {
		// Já curtiu → descurtir
		if err = r.db.Delete(&existing).Error; err != nil {
			return false, 0, err
		}
		if err = r.db.Model(&models.Comment{}).Where("id = ?", commentID).
			UpdateColumn("likes_count", gorm.Expr("GREATEST(likes_count - 1, 0)")).Error; err != nil {
			return false, 0, err
		}
		liked = false
	} else if errors.Is(findErr, gorm.ErrRecordNotFound) {
		// Ainda não curtiu → curtir
		if err = r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&like).Error; err != nil {
			return false, 0, err
		}
		if err = r.db.Model(&models.Comment{}).Where("id = ?", commentID).
			UpdateColumn("likes_count", gorm.Expr("likes_count + 1")).Error; err != nil {
			return false, 0, err
		}
		liked = true
	} else {
		return false, 0, findErr
	}

	var c models.Comment
	if err = r.db.Select("likes_count").First(&c, commentID).Error; err != nil {
		return liked, 0, err
	}
	return liked, c.LikesCount, nil
}

// LikedByUser retorna true se o usuário já curtiu o comentário.
func (r *CommentRepository) LikedByUser(userID, commentID int) (bool, error) {
	var count int64
	err := r.db.Model(&models.CommentLike{}).
		Where("user_id = ? AND comment_id = ?", userID, commentID).
		Count(&count).Error
	return count > 0, err
}

// LikedIDsByUser retorna os IDs de comentários curtidos pelo usuário dentro de uma lista.
func (r *CommentRepository) LikedIDsByUser(userID int, commentIDs []int) ([]int, error) {
	if len(commentIDs) == 0 {
		return nil, nil
	}
	var likes []models.CommentLike
	err := r.db.Where("user_id = ? AND comment_id IN ?", userID, commentIDs).Find(&likes).Error
	if err != nil {
		return nil, err
	}
	ids := make([]int, 0, len(likes))
	for _, l := range likes {
		ids = append(ids, l.CommentID)
	}
	return ids, nil
}

// CreateReport registra uma denúncia; retorna ErrAlreadyReported se duplicada.
func (r *CommentRepository) CreateReport(userID, commentID int, reason string) error {
	var count int64
	r.db.Model(&models.CommentReport{}).
		Where("user_id = ? AND comment_id = ?", userID, commentID).
		Count(&count)
	if count > 0 {
		return ErrAlreadyReported
	}
	report := models.CommentReport{
		UserID:    userID,
		CommentID: commentID,
		Reason:    reason,
	}
	return r.db.Create(&report).Error
}
