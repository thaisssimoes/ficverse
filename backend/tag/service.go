package tag

import (
	"errors"
	"strings"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrTagNameRequired = errors.New("tag name is required")
	ErrTagTypeRequired = errors.New("tag type is required")
)

// TagService handles business logic for tags
type TagService struct {
	repo *TagRepository
}

// NewTagService creates a new tag service
func NewTagService(db *gorm.DB) *TagService {
	return &TagService{
		repo: NewTagRepository(db),
	}
}

// CreateTag creates a new tag with validation
func (s *TagService) CreateTag(name, tagType string) (*models.Tag, error) {
	// Validate input
	if strings.TrimSpace(name) == "" {
		return nil, ErrTagNameRequired
	}
	
	if strings.TrimSpace(tagType) == "" {
		return nil, ErrTagTypeRequired
	}

	return s.repo.CreateTag(name, tagType)
}

// GetOrCreateTag gets an existing tag or creates it if it doesn't exist
func (s *TagService) GetOrCreateTag(name, tagType string) (*models.Tag, error) {
	// Validate input
	if strings.TrimSpace(name) == "" {
		return nil, ErrTagNameRequired
	}
	
	if strings.TrimSpace(tagType) == "" {
		return nil, ErrTagTypeRequired
	}

	return s.repo.GetOrCreateTag(name, tagType)
}

// GetTagsByType retrieves all tags of a specific type
func (s *TagService) GetTagsByType(tagType string) ([]models.Tag, error) {
	if strings.TrimSpace(tagType) == "" {
		return nil, ErrTagTypeRequired
	}

	return s.repo.GetTagsByType(tagType)
}

// SearchTags searches for tags by name pattern and optional type
func (s *TagService) SearchTags(query, tagType string) ([]models.Tag, error) {
	return s.repo.SearchTags(query, tagType)
}

// AddTagsToFanfic adds tags to a fanfic with limit validation
func (s *TagService) AddTagsToFanfic(fanficID int, tagIDs []int) error {
	if fanficID <= 0 {
		return errors.New("invalid fanfic ID")
	}

	return s.repo.AddTagsToFanfic(fanficID, tagIDs)
}

// RemoveTagFromFanfic removes a tag from a fanfic
func (s *TagService) RemoveTagFromFanfic(fanficID, tagID int) error {
	if fanficID <= 0 {
		return errors.New("invalid fanfic ID")
	}
	
	if tagID <= 0 {
		return errors.New("invalid tag ID")
	}

	return s.repo.RemoveTagFromFanfic(fanficID, tagID)
}

// GetFanficTags retrieves all tags for a specific fanfic
func (s *TagService) GetFanficTags(fanficID int) ([]models.Tag, error) {
	if fanficID <= 0 {
		return nil, errors.New("invalid fanfic ID")
	}

	return s.repo.GetFanficTags(fanficID)
}

// SearchFanficsByTags searches for fanfics that have ALL specified tags (AND logic)
func (s *TagService) SearchFanficsByTags(tagIDs []int) ([]models.Fanfic, error) {
	return s.repo.SearchFanficsByTags(tagIDs)
}

// GetTagsByTypeGrouped retrieves all tags grouped by type
func (s *TagService) GetTagsByTypeGrouped() (map[string][]models.Tag, error) {
	result := make(map[string][]models.Tag)
	
	// Get tags for each type
	types := []string{TagTypeFandom, TagTypeWarning, TagTypePairing}
	for _, tagType := range types {
		tags, err := s.repo.GetTagsByType(tagType)
		if err != nil {
			return nil, err
		}
		result[tagType] = tags
	}
	
	return result, nil
}
