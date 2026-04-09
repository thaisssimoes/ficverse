package fanfic

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrFanficNotFound    = errors.New("fanfic not found")
	ErrInvalidImageFormat = errors.New("invalid image format")
	ErrImageTooLarge     = errors.New("image size exceeds maximum allowed")
	ErrUnauthorized      = errors.New("unauthorized to perform this action")
)

const (
	MaxImageSize = 5 * 1024 * 1024 // 5MB
	UploadDir    = "uploads/covers"
)

// FanficRepository handles database operations for fanfics
type FanficRepository struct {
	db *gorm.DB
}

// NewFanficRepository creates a new fanfic repository
func NewFanficRepository(db *gorm.DB) *FanficRepository {
	return &FanficRepository{db: db}
}

// Create creates a new fanfic
func (r *FanficRepository) Create(fanfic *models.Fanfic) error {
	result := r.db.Create(fanfic)
	if result.Error != nil {
		return fmt.Errorf("failed to create fanfic: %w", result.Error)
	}
	return nil
}

// GetByID retrieves a fanfic by ID
func (r *FanficRepository) GetByID(id int) (*models.Fanfic, error) {
	var fanfic models.Fanfic
	result := r.db.Preload("Author").First(&fanfic, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrFanficNotFound
		}
		return nil, fmt.Errorf("failed to get fanfic: %w", result.Error)
	}
	return &fanfic, nil
}

// GetByAuthorID retrieves all fanfics by a specific author
func (r *FanficRepository) GetByAuthorID(authorID int) ([]models.Fanfic, error) {
	var fanfics []models.Fanfic
	result := r.db.Where("author_id = ?", authorID).
		Order("created_at DESC").
		Find(&fanfics)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get fanfics by author: %w", result.Error)
	}
	return fanfics, nil
}

// GetByAuthorIDWithDraftFilter retrieves fanfics by author with optional draft filtering
func (r *FanficRepository) GetByAuthorIDWithDraftFilter(authorID int, includeDrafts bool) ([]models.Fanfic, error) {
	var fanfics []models.Fanfic
	query := r.db.Where("author_id = ?", authorID)
	
	if !includeDrafts {
		query = query.Where("is_draft = ?", false)
	}
	
	result := query.Order("created_at DESC").Find(&fanfics)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get fanfics by author: %w", result.Error)
	}
	return fanfics, nil
}

// hasChaptersClause is the EXISTS subquery that ensures a fanfic has at least one published chapter.
const hasChaptersClause = "EXISTS (SELECT 1 FROM chapters WHERE chapters.fanfic_id = fanfics.id AND chapters.is_draft = false)"

// GetAll retrieves all published fanfics that have at least one published chapter.
func (r *FanficRepository) GetAll() ([]models.Fanfic, error) {
	var fanfics []models.Fanfic
	result := r.db.Where("is_draft = ? AND "+hasChaptersClause, false).
		Preload("Author").
		Order("created_at DESC").
		Find(&fanfics)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get all fanfics: %w", result.Error)
	}
	return fanfics, nil
}

// GetByCategory retrieves all published fanfics in a specific category with at least one published chapter.
func (r *FanficRepository) GetByCategory(category string) ([]models.Fanfic, error) {
	var fanfics []models.Fanfic
	result := r.db.Where("category = ? AND is_draft = ? AND "+hasChaptersClause, category, false).
		Preload("Author").
		Order("created_at DESC").
		Find(&fanfics)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get fanfics by category: %w", result.Error)
	}
	return fanfics, nil
}

// SearchByTitle searches published fanfics by title (case-insensitive partial match, excludes drafts)
func (r *FanficRepository) SearchByTitle(query string, limit int) ([]models.Fanfic, error) {
	var fanfics []models.Fanfic
	searchPattern := "%" + strings.ToLower(query) + "%"
	
	result := r.db.Where("LOWER(title) LIKE ? AND is_draft = ? AND "+hasChaptersClause, searchPattern, false).
		Preload("Author").
		Order("created_at DESC").
		Limit(limit).
		Find(&fanfics)
	
	if result.Error != nil {
		return nil, fmt.Errorf("failed to search fanfics: %w", result.Error)
	}
	return fanfics, nil
}

// GetFeatured retrieves featured published fanfics (most recent with covers, excludes drafts)
func (r *FanficRepository) GetFeatured(limit int) ([]models.Fanfic, error) {
	var fanfics []models.Fanfic
	
	// Get published fanfics with covers, ordered by creation date
	result := r.db.Where("cover_url != '' AND is_draft = ? AND "+hasChaptersClause, false).
		Preload("Author").
		Order("created_at DESC").
		Limit(limit).
		Find(&fanfics)
	
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get featured fanfics: %w", result.Error)
	}
	return fanfics, nil
}

// GetTrending retrieves trending published fanfics (most recent, excludes drafts)
func (r *FanficRepository) GetTrending(limit int) ([]models.Fanfic, error) {
	var fanfics []models.Fanfic
	
	// For now, trending is based on most recent published fanfics
	// In the future, this could be based on views, likes, comments, etc.
	result := r.db.Where("is_draft = ? AND "+hasChaptersClause, false).
		Preload("Author").
		Order("created_at DESC").
		Limit(limit).
		Find(&fanfics)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to get trending fanfics: %w", result.Error)
	}
	return fanfics, nil
}

// GetTrendingByCategory retrieves trending published fanfics filtered by category (excludes drafts)
func (r *FanficRepository) GetTrendingByCategory(category string, limit int) ([]models.Fanfic, error) {
	var fanfics []models.Fanfic
	
	result := r.db.Where("category = ? AND is_draft = ? AND "+hasChaptersClause, category, false).
		Preload("Author").
		Order("created_at DESC").
		Limit(limit).
		Find(&fanfics)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to get trending fanfics by category: %w", result.Error)
	}
	return fanfics, nil
}

// Update updates a fanfic
func (r *FanficRepository) Update(fanfic *models.Fanfic) error {
	result := r.db.Save(fanfic)
	if result.Error != nil {
		return fmt.Errorf("failed to update fanfic: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrFanficNotFound
	}
	return nil
}

// Delete deletes a fanfic by ID
func (r *FanficRepository) Delete(id int) error {
	result := r.db.Delete(&models.Fanfic{}, id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete fanfic: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrFanficNotFound
	}
	return nil
}

// SaveCoverImage saves a cover image to disk and returns the URL
func (r *FanficRepository) SaveCoverImage(filename string, data []byte) (string, error) {
	// Validate image format
	if !isValidImageFormat(filename) {
		return "", ErrInvalidImageFormat
	}

	// Validate image size
	if len(data) > MaxImageSize {
		return "", ErrImageTooLarge
	}

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(UploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Generate unique filename
	ext := filepath.Ext(filename)
	uniqueFilename := fmt.Sprintf("%d%s", generateUniqueID(), ext)

	// Use filepath.Join only for the disk path (OS-specific separators)
	diskPath := filepath.Join(UploadDir, uniqueFilename)

	// Write file
	if err := os.WriteFile(diskPath, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write image file: %w", err)
	}

	// Always return a clean URL path with forward slashes, independent of OS
	return "/uploads/covers/" + uniqueFilename, nil
}

// DeleteCoverImage deletes a cover image from disk
func (r *FanficRepository) DeleteCoverImage(coverURL string) error {
	if coverURL == "" {
		return nil
	}

	// Remove leading slash if present
	filePath := strings.TrimPrefix(coverURL, "/")

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil // File doesn't exist, nothing to delete
	}

	// Delete file
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("failed to delete cover image: %w", err)
	}

	return nil
}

// isValidImageFormat checks if the filename has a valid image extension
func isValidImageFormat(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	for _, validExt := range validExtensions {
		if ext == validExt {
			return true
		}
	}
	return false
}

// generateUniqueID generates a unique ID for filenames (simple implementation)
func generateUniqueID() int64 {
	return time.Now().UnixNano()
}
