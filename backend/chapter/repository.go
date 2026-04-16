package chapter

import (
	"errors"
	"fmt"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrChapterNotFound = errors.New("chapter not found")
	ErrUnauthorized    = errors.New("unauthorized to perform this action")
	ErrInvalidOrder    = errors.New("invalid chapter order")
)

// ChapterRepository handles database operations for chapters
type ChapterRepository struct {
	db *gorm.DB
}

// NewChapterRepository creates a new chapter repository
func NewChapterRepository(db *gorm.DB) *ChapterRepository {
	return &ChapterRepository{db: db}
}

// Create creates a new chapter
func (r *ChapterRepository) Create(chapter *models.Chapter) error {
	result := r.db.Create(chapter)
	if result.Error != nil {
		return fmt.Errorf("failed to create chapter: %w", result.Error)
	}
	return nil
}

// GetByID retrieves a chapter by ID
func (r *ChapterRepository) GetByID(id int) (*models.Chapter, error) {
	var chapter models.Chapter
	result := r.db.First(&chapter, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrChapterNotFound
		}
		return nil, fmt.Errorf("failed to get chapter: %w", result.Error)
	}
	return &chapter, nil
}

// GetByIDWithFanfic retrieves a chapter by ID with fanfic preloaded
func (r *ChapterRepository) GetByIDWithFanfic(id int) (*models.Chapter, error) {
	var chapter models.Chapter
	result := r.db.Preload("Fanfic").First(&chapter, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrChapterNotFound
		}
		return nil, fmt.Errorf("failed to get chapter: %w", result.Error)
	}
	return &chapter, nil
}

// GetByFanficID retrieves all chapters for a specific fanfic, ordered by Order field
func (r *ChapterRepository) GetByFanficID(fanficID int) ([]models.Chapter, error) {
	var chapters []models.Chapter
	result := r.db.Where("fanfic_id = ?", fanficID).
		Order("\"order\" ASC").
		Find(&chapters)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get chapters by fanfic: %w", result.Error)
	}
	return chapters, nil
}

// Update updates a chapter
func (r *ChapterRepository) Update(chapter *models.Chapter) error {
	result := r.db.Save(chapter)
	if result.Error != nil {
		return fmt.Errorf("failed to update chapter: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrChapterNotFound
	}
	return nil
}

// Delete deletes a chapter by ID
func (r *ChapterRepository) Delete(id int) error {
	result := r.db.Delete(&models.Chapter{}, id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete chapter: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrChapterNotFound
	}
	return nil
}

// GetMaxOrder returns the maximum order value for chapters in a fanfic
func (r *ChapterRepository) GetMaxOrder(fanficID int) (int, error) {
	var maxOrder int
	result := r.db.Model(&models.Chapter{}).
		Where("fanfic_id = ?", fanficID).
		Select("COALESCE(MAX(\"order\"), 0)").
		Scan(&maxOrder)
	if result.Error != nil {
		return 0, fmt.Errorf("failed to get max order: %w", result.Error)
	}
	return maxOrder, nil
}

// UpdateOrdersAfterDelete adjusts chapter orders after a deletion
func (r *ChapterRepository) UpdateOrdersAfterDelete(fanficID int, deletedOrder int) error {
	result := r.db.Model(&models.Chapter{}).
		Where("fanfic_id = ? AND \"order\" > ?", fanficID, deletedOrder).
		Update("\"order\"", gorm.Expr("\"order\" - 1"))
	if result.Error != nil {
		return fmt.Errorf("failed to update orders after delete: %w", result.Error)
	}
	return nil
}

// IncrementViews incrementa atomicamente o contador de visualizações de um capítulo.
func (r *ChapterRepository) IncrementViews(id int) error {
	return r.db.Model(&models.Chapter{}).
		Where("id = ?", id).
		UpdateColumn("views_count", gorm.Expr("views_count + 1")).Error
}

// ToggleLike adiciona ou remove o like de um usuário num capítulo.
// Retorna o novo estado (liked) e a contagem atualizada.
func (r *ChapterRepository) ToggleLike(userID, chapterID int) (liked bool, count int, err error) {
	var like models.ChapterLike
	result := r.db.Where("user_id = ? AND chapter_id = ?", userID, chapterID).First(&like)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Ainda não curtiu → curtir
		if err = r.db.Create(&models.ChapterLike{UserID: userID, ChapterID: chapterID}).Error; err != nil {
			return false, 0, fmt.Errorf("failed to create chapter like: %w", err)
		}
		r.db.Model(&models.Chapter{}).Where("id = ?", chapterID).
			UpdateColumn("likes_count", gorm.Expr("likes_count + 1"))
		liked = true
	} else if result.Error != nil {
		return false, 0, fmt.Errorf("failed to check chapter like: %w", result.Error)
	} else {
		// Já curtiu → descurtir
		r.db.Delete(&like)
		r.db.Model(&models.Chapter{}).Where("id = ?", chapterID).
			UpdateColumn("likes_count", gorm.Expr("GREATEST(likes_count - 1, 0)"))
		liked = false
	}

	var ch models.Chapter
	r.db.Select("likes_count").First(&ch, chapterID)
	return liked, ch.LikesCount, nil
}

// LikedIDsByUser retorna os IDs de capítulos que o usuário curtiu dentro de um conjunto de IDs.
func (r *ChapterRepository) LikedIDsByUser(userID int, chapterIDs []int) ([]int, error) {
	if len(chapterIDs) == 0 {
		return nil, nil
	}
	var ids []int
	err := r.db.Model(&models.ChapterLike{}).
		Where("user_id = ? AND chapter_id IN ?", userID, chapterIDs).
		Pluck("chapter_id", &ids).Error
	return ids, err
}

// UpdateOrder updates the order of a specific chapter
func (r *ChapterRepository) UpdateOrder(chapterID int, newOrder int) error {
	result := r.db.Model(&models.Chapter{}).
		Where("id = ?", chapterID).
		Update("\"order\"", newOrder)
	if result.Error != nil {
		return fmt.Errorf("failed to update chapter order: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrChapterNotFound
	}
	return nil
}
