package routes

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/fanfic"
	"github.com/interactive-fanfic-platform/tag"
	"gorm.io/gorm"
)

// TagHandler handles tag endpoints
type TagHandler struct {
	service       *tag.TagService
	fanficService *fanfic.FanficService
}

// NewTagHandler creates a new tag handler
func NewTagHandler(db *gorm.DB) *TagHandler {
	return &TagHandler{
		service:       tag.NewTagService(db),
		fanficService: fanfic.NewFanficService(db),
	}
}

// CreateTagRequest represents tag creation request
type CreateTagRequest struct {
	Name string `json:"name" binding:"required"`
	Type string `json:"type" binding:"required"`
}

// AddTagsRequest represents request to add tags to a fanfic
type AddTagsRequest struct {
	TagIDs []int `json:"tag_ids" binding:"required"`
}

// CreateTag creates a new tag
// POST /api/tags
func (h *TagHandler) CreateTag(c *gin.Context) {
	var req CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request body",
			},
		})
		return
	}

	newTag, err := h.service.GetOrCreateTag(req.Name, req.Type)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "CREATION_ERROR"

		if errors.Is(err, tag.ErrInvalidTagType) {
			code = "INVALID_TAG_TYPE"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, newTag)
}

// ListTagsByType lists all tags of a specific type
// GET /api/tags?type={type}
func (h *TagHandler) ListTagsByType(c *gin.Context) {
	tagType := c.Query("type")
	
	if tagType == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Tag type is required",
			},
		})
		return
	}

	tags, err := h.service.GetTagsByType(tagType)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "QUERY_ERROR"

		if errors.Is(err, tag.ErrInvalidTagType) {
			code = "INVALID_TAG_TYPE"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, tags)
}

// SearchTags searches for tags by name pattern
// GET /api/tags/search?q={query}&type={type}
func (h *TagHandler) SearchTags(c *gin.Context) {
	query := c.Query("q")
	tagType := c.Query("type")

	if query == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Search query is required",
			},
		})
		return
	}

	tags, err := h.service.SearchTags(query, tagType)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "SEARCH_ERROR"

		if errors.Is(err, tag.ErrInvalidTagType) {
			code = "INVALID_TAG_TYPE"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, tags)
}

// AddTagsToFanfic adds tags to a fanfic
// POST /api/fanfics/:id/tags
func (h *TagHandler) AddTagsToFanfic(c *gin.Context) {
	// Get authenticated user
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
		return
	}

	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	// Verify user is the fanfic author
	fanficData, err := h.fanficService.GetFanfic(fanficID)
	if err != nil {
		if errors.Is(err, fanfic.ErrFanficNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "FANFIC_NOT_FOUND",
					Message: "Fanfic not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to verify fanfic ownership",
			},
		})
		return
	}

	if fanficData.AuthorID != user.ID {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error: ErrorDetail{
				Code:    "FORBIDDEN",
				Message: "You don't have permission to add tags to this fanfic",
			},
		})
		return
	}

	var req AddTagsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request body",
			},
		})
		return
	}

	err = h.service.AddTagsToFanfic(fanficID, req.TagIDs)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "ADD_TAGS_ERROR"

		if strings.Contains(err.Error(), "tag limit exceeded") {
			code = "TAG_LIMIT_EXCEEDED"
		} else if strings.Contains(err.Error(), "fanfic not found") {
			statusCode = http.StatusNotFound
			code = "FANFIC_NOT_FOUND"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tags added successfully"})
}

// RemoveTagFromFanfic removes a tag from a fanfic
// DELETE /api/fanfics/:id/tags/:tagId
func (h *TagHandler) RemoveTagFromFanfic(c *gin.Context) {
	// Get authenticated user
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
		return
	}

	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	tagID, err := strconv.Atoi(c.Param("tagId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid tag ID",
			},
		})
		return
	}

	// Verify user is the fanfic author
	fanficData, err := h.fanficService.GetFanfic(fanficID)
	if err != nil {
		if errors.Is(err, fanfic.ErrFanficNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "FANFIC_NOT_FOUND",
					Message: "Fanfic not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to verify fanfic ownership",
			},
		})
		return
	}

	if fanficData.AuthorID != user.ID {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error: ErrorDetail{
				Code:    "FORBIDDEN",
				Message: "You don't have permission to remove tags from this fanfic",
			},
		})
		return
	}

	err = h.service.RemoveTagFromFanfic(fanficID, tagID)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "REMOVE_TAG_ERROR"

		if errors.Is(err, tag.ErrTagNotFound) {
			statusCode = http.StatusNotFound
			code = "TAG_NOT_FOUND"
		} else if strings.Contains(err.Error(), "fanfic not found") {
			statusCode = http.StatusNotFound
			code = "FANFIC_NOT_FOUND"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetFanficTags retrieves all tags for a specific fanfic
// GET /api/fanfics/:id/tags
func (h *TagHandler) GetFanficTags(c *gin.Context) {
	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	tags, err := h.service.GetFanficTags(fanficID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		code := "QUERY_ERROR"

		if strings.Contains(err.Error(), "fanfic not found") {
			statusCode = http.StatusNotFound
			code = "FANFIC_NOT_FOUND"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, tags)
}

// SearchFanficsByTags searches for fanfics that have all specified tags
// GET /api/fanfics/search/tags?tagIds={ids}
func (h *TagHandler) SearchFanficsByTags(c *gin.Context) {
	tagIDsStr := c.Query("tagIds")
	
	if tagIDsStr == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Tag IDs are required",
			},
		})
		return
	}

	// Parse comma-separated tag IDs
	tagIDStrings := strings.Split(tagIDsStr, ",")
	tagIDs := make([]int, 0, len(tagIDStrings))
	
	for _, idStr := range tagIDStrings {
		id, err := strconv.Atoi(strings.TrimSpace(idStr))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: ErrorDetail{
					Code:    "INVALID_TAG_IDS",
					Message: "Invalid tag ID format",
				},
			})
			return
		}
		tagIDs = append(tagIDs, id)
	}

	fanfics, err := h.service.SearchFanficsByTags(tagIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "SEARCH_ERROR",
				Message: "Failed to search fanfics by tags",
			},
		})
		return
	}

	c.JSON(http.StatusOK, fanfics)
}
