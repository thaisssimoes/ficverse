package tag

import (
	"errors"
	"fmt"
	"strings"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrTagNotFound      = errors.New("tag not found")
	ErrTagLimitExceeded = errors.New("tag limit exceeded for this type")
	ErrInvalidTagType   = errors.New("invalid tag type")
)

const (
	MaxTagsPerType = 5
	TagTypeFandom  = "fandom"
	TagTypeWarning = "warning"
	TagTypePairing = "pairing"
)

// TagRepository handles database operations for tags
type TagRepository struct {
	db *gorm.DB
}

// NewTagRepository creates a new tag repository
func NewTagRepository(db *gorm.DB) *TagRepository {
	return &TagRepository{db: db}
}

// CreateTag creates a new tag
func (r *TagRepository) CreateTag(name, tagType string) (*models.Tag, error) {
	// Validate tag type
	if !isValidTagType(tagType) {
		return nil, ErrInvalidTagType
	}

	tag := &models.Tag{
		Name: strings.TrimSpace(name),
		Type: tagType,
	}

	result := r.db.Create(tag)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create tag: %w", result.Error)
	}

	return tag, nil
}

// GetOrCreateTag gets an existing tag or creates it if it doesn't exist
func (r *TagRepository) GetOrCreateTag(name, tagType string) (*models.Tag, error) {
	// Validate tag type
	if !isValidTagType(tagType) {
		return nil, ErrInvalidTagType
	}

	name = strings.TrimSpace(name)
	
	// Try to find existing tag
	var tag models.Tag
	result := r.db.Where("name = ? AND type = ?", name, tagType).First(&tag)
	
	if result.Error == nil {
		// Tag exists
		return &tag, nil
	}
	
	if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Database error
		return nil, fmt.Errorf("failed to query tag: %w", result.Error)
	}
	
	// Tag doesn't exist, create it
	return r.CreateTag(name, tagType)
}

// GetTagsByType retrieves all tags of a specific type
func (r *TagRepository) GetTagsByType(tagType string) ([]models.Tag, error) {
	// Validate tag type
	if !isValidTagType(tagType) {
		return nil, ErrInvalidTagType
	}

	var tags []models.Tag
	result := r.db.Where("type = ?", tagType).
		Order("name ASC").
		Find(&tags)
	
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get tags by type: %w", result.Error)
	}
	
	return tags, nil
}

// SearchTags searches for tags by name pattern and optional type
func (r *TagRepository) SearchTags(query, tagType string) ([]models.Tag, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return []models.Tag{}, nil
	}

	searchPattern := "%" + strings.ToLower(query) + "%"
	
	db := r.db.Where("LOWER(name) LIKE ?", searchPattern)
	
	// Filter by type if provided
	if tagType != "" {
		if !isValidTagType(tagType) {
			return nil, ErrInvalidTagType
		}
		db = db.Where("type = ?", tagType)
	}
	
	var tags []models.Tag
	result := db.Order("name ASC").Find(&tags)
	
	if result.Error != nil {
		return nil, fmt.Errorf("failed to search tags: %w", result.Error)
	}
	
	return tags, nil
}

// AddTagsToFanfic adds tags to a fanfic with limit validation
func (r *TagRepository) AddTagsToFanfic(fanficID int, tagIDs []int) error {
	if len(tagIDs) == 0 {
		return nil
	}

	// Get the fanfic with existing tags
	var fanfic models.Fanfic
	result := r.db.Preload("Tags").First(&fanfic, fanficID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return fmt.Errorf("fanfic not found")
		}
		return fmt.Errorf("failed to get fanfic: %w", result.Error)
	}

	// Get the tags to be added
	var tagsToAdd []models.Tag
	result = r.db.Where("id IN ?", tagIDs).Find(&tagsToAdd)
	if result.Error != nil {
		return fmt.Errorf("failed to get tags: %w", result.Error)
	}

	// Count existing tags by type
	tagCountByType := make(map[string]int)
	for _, tag := range fanfic.Tags {
		tagCountByType[tag.Type]++
	}

	// Validate tag limits for new tags
	for _, tag := range tagsToAdd {
		// Check if tag is already associated
		alreadyExists := false
		for _, existingTag := range fanfic.Tags {
			if existingTag.ID == tag.ID {
				alreadyExists = true
				break
			}
		}
		
		if !alreadyExists {
			if tagCountByType[tag.Type] >= MaxTagsPerType {
				return fmt.Errorf("%w: %s (max %d)", ErrTagLimitExceeded, tag.Type, MaxTagsPerType)
			}
			tagCountByType[tag.Type]++
		}
	}

	// Add tags using GORM's association
	if err := r.db.Model(&fanfic).Association("Tags").Append(&tagsToAdd); err != nil {
		return fmt.Errorf("failed to add tags to fanfic: %w", err)
	}

	return nil
}

// RemoveTagFromFanfic removes a tag from a fanfic
func (r *TagRepository) RemoveTagFromFanfic(fanficID, tagID int) error {
	// Get the fanfic
	var fanfic models.Fanfic
	result := r.db.First(&fanfic, fanficID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return fmt.Errorf("fanfic not found")
		}
		return fmt.Errorf("failed to get fanfic: %w", result.Error)
	}

	// Get the tag
	var tag models.Tag
	result = r.db.First(&tag, tagID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return ErrTagNotFound
		}
		return fmt.Errorf("failed to get tag: %w", result.Error)
	}

	// Remove the association
	if err := r.db.Model(&fanfic).Association("Tags").Delete(&tag); err != nil {
		return fmt.Errorf("failed to remove tag from fanfic: %w", err)
	}

	return nil
}

// GetFanficTags retrieves all tags for a specific fanfic
func (r *TagRepository) GetFanficTags(fanficID int) ([]models.Tag, error) {
	var fanfic models.Fanfic
	result := r.db.Preload("Tags").First(&fanfic, fanficID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("fanfic not found")
		}
		return nil, fmt.Errorf("failed to get fanfic tags: %w", result.Error)
	}

	return fanfic.Tags, nil
}

// SearchFanficsByTags searches for fanfics that have ALL specified tags (AND logic)
func (r *TagRepository) SearchFanficsByTags(tagIDs []int) ([]models.Fanfic, error) {
	if len(tagIDs) == 0 {
		return []models.Fanfic{}, nil
	}

	// Use a subquery to find fanfics that have all specified tags
	// This implements AND logic: fanfic must have ALL tags
	var fanfics []models.Fanfic
	
	// Build the query: find fanfics where the count of matching tags equals the number of requested tags
	result := r.db.
		Joins("JOIN fanfic_tags ON fanfic_tags.fanfic_id = fanfics.id").
		Where("fanfic_tags.tag_id IN ?", tagIDs).
		Group("fanfics.id").
		Having("COUNT(DISTINCT fanfic_tags.tag_id) = ?", len(tagIDs)).
		Preload("Author").
		Preload("Tags").
		Order("fanfics.created_at DESC").
		Find(&fanfics)
	
	if result.Error != nil {
		return nil, fmt.Errorf("failed to search fanfics by tags: %w", result.Error)
	}
	
	return fanfics, nil
}

// isValidTagType checks if a tag type is valid
func isValidTagType(tagType string) bool {
	return tagType == TagTypeFandom || tagType == TagTypeWarning || tagType == TagTypePairing
}
