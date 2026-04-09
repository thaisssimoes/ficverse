package comment

import (
	"errors"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrCommentNotFound = errors.New("comment not found")
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

// GetByFanficID retrieves all comments for a fanfic
func (r *CommentRepository) GetByFanficID(fanficID int) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.Where("fanfic_id = ?", fanficID).
		Preload("User").
		Order("created_at ASC").
		Find(&comments).Error
	return comments, err
}

// GetByChapterID retrieves all comments for a chapter
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
