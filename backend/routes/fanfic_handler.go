package routes

import (
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/fanfic"
	"github.com/interactive-fanfic-platform/storage"
	"gorm.io/gorm"
)

// FanficHandler handles fanfic endpoints
type FanficHandler struct {
	service *fanfic.FanficService
	db      *gorm.DB
	store   storage.StorageService
}

// NewFanficHandler creates a new fanfic handler
func NewFanficHandler(db *gorm.DB, store storage.StorageService) *FanficHandler {
	return &FanficHandler{
		service: fanfic.NewFanficService(db),
		db:      db,
		store:   store,
	}
}

// CreateFanficRequest represents fanfic creation request (JSON body)
type CreateFanficRequest struct {
	Title           string `json:"title" binding:"required"`
	Synopsis        string `json:"synopsis" binding:"required"`
	Disclaimer      string `json:"disclaimer"`
	Category        string `json:"category" binding:"required"`
	InteractiveMode bool   `json:"interactive_mode"`
	IsDraft         *bool  `json:"is_draft"`
	IsAdultContent  bool   `json:"is_adult_content"`
	TriggerWarnings string `json:"trigger_warnings"`
}

// UpdateFanficRequest represents fanfic update request (JSON body)
type UpdateFanficRequest struct {
	Title           string  `json:"title"`
	Synopsis        string  `json:"synopsis"`
	Disclaimer      string  `json:"disclaimer"`
	Category        string  `json:"category"`
	InteractiveMode *bool   `json:"interactive_mode"`
	IsAdultContent  *bool   `json:"is_adult_content"`
	TriggerWarnings string  `json:"trigger_warnings"`
	CoverURL        string  `json:"cover_url"`
	IsComplete      *bool   `json:"is_complete"`
	IsHiatus        *bool   `json:"is_hiatus"`
	HiatusUntil     *string `json:"hiatus_until"`
	ActivityTag     string  `json:"activity_tag"`
}

// ListByCategory lists all fanfics grouped by category
func (h *FanficHandler) ListByCategory(c *gin.Context) {
	fanficsByCategory, err := h.service.ListFanficsByCategory()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve fanfics",
			},
		})
		return
	}

	c.JSON(http.StatusOK, fanficsByCategory)
}

// GetByID retrieves a fanfic by ID
func (h *FanficHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	// Check if user is authenticated (to allow viewing drafts for authors)
	user, authenticated := auth.GetCurrentUser(c)
	
	// Get fanfic
	fanficData, err := h.service.GetFanfic(id)
	if err != nil {
		if errors.Is(err, fanfic.ErrFanficNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Fanfic not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve fanfic",
			},
		})
		return
	}

	// If fanfic is draft, only allow author to view it
	if fanficData.IsDraft {
		if !authenticated || user.ID != fanficData.AuthorID {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Fanfic not found",
				},
			})
			return
		}
	}

	c.JSON(http.StatusOK, fanficData)
}

// Create creates a new fanfic
func (h *FanficHandler) Create(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"},
		})
		return
	}

	var req CreateFanficRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{Code: "VALIDATION_ERROR", Message: err.Error()},
		})
		return
	}

	newFanfic, err := h.service.CreateFanfic(
		user.ID,
		req.Title,
		req.Synopsis,
		req.Disclaimer,
		req.Category,
		"", nil, // capa enviada separadamente via /upload/cover
		req.InteractiveMode,
		req.IsDraft,
		req.IsAdultContent,
		req.TriggerWarnings,
	)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "CREATION_ERROR"
		if errors.Is(err, fanfic.ErrTitleRequired) {
			code = "TITLE_REQUIRED"
		} else if errors.Is(err, fanfic.ErrSynopsisRequired) {
			code = "SYNOPSIS_REQUIRED"
		} else if errors.Is(err, fanfic.ErrCategoryRequired) {
			code = "CATEGORY_REQUIRED"
		}
		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{Code: code, Message: err.Error()},
		})
		return
	}

	c.JSON(http.StatusCreated, newFanfic)
}

// Update updates a fanfic
func (h *FanficHandler) Update(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"},
		})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid fanfic ID"},
		})
		return
	}

	var req UpdateFanficRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{Code: "VALIDATION_ERROR", Message: err.Error()},
		})
		return
	}

	var hiatusUntil *time.Time
	if req.HiatusUntil != nil && *req.HiatusUntil != "" {
		if t, err := time.Parse(time.RFC3339, *req.HiatusUntil); err == nil {
			hiatusUntil = &t
		}
	}

	updatedFanfic, err := h.service.UpdateFanfic(
		id,
		user.ID,
		req.Title,
		req.Synopsis,
		req.Disclaimer,
		req.Category,
		req.CoverURL,
		req.InteractiveMode,
		req.IsAdultContent,
		req.TriggerWarnings,
		req.IsComplete,
		req.IsHiatus,
		hiatusUntil,
		req.ActivityTag,
	)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "UPDATE_ERROR"
		if errors.Is(err, fanfic.ErrFanficNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		} else if errors.Is(err, fanfic.ErrUnauthorized) {
			statusCode = http.StatusForbidden
			code = "FORBIDDEN"
		}
		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{Code: code, Message: err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, updatedFanfic)
}

// Delete deletes a fanfic
func (h *FanficHandler) Delete(c *gin.Context) {
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

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	err = h.service.DeleteFanfic(id, user.ID)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "DELETE_ERROR"

		if errors.Is(err, fanfic.ErrFanficNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		} else if errors.Is(err, fanfic.ErrUnauthorized) {
			statusCode = http.StatusForbidden
			code = "FORBIDDEN"
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

// GetByAuthor retrieves all fanfics by a specific author
func (h *FanficHandler) GetByAuthor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	// Check if user is authenticated and is the author
	user, authenticated := auth.GetCurrentUser(c)
	isAuthor := authenticated && user.ID == id

	// Parse includeDrafts parameter (only allow if user is the author)
	includeDrafts := false
	if isAuthor {
		includeDraftsStr := c.Query("includeDrafts")
		includeDrafts = includeDraftsStr == "true"
	}

	fanfics, err := h.service.GetAuthorFanfics(id, includeDrafts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve fanfics",
			},
		})
		return
	}

	c.JSON(http.StatusOK, fanfics)
}

// GetFeatured retrieves featured fanfics for the hero section
func (h *FanficHandler) GetFeatured(c *gin.Context) {
	// Get limit from query parameter, default to 5
	limit := 5
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	fanfics, err := h.service.GetFeaturedFanfics(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve featured fanfics",
			},
		})
		return
	}

	c.JSON(http.StatusOK, fanfics)
}

// GetTrending retrieves trending fanfics with optional category filter
func (h *FanficHandler) GetTrending(c *gin.Context) {
	// Get category from query parameter
	category := c.Query("category")
	
	// Get limit from query parameter, default to 12
	limit := 12
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	fanfics, err := h.service.GetTrendingFanfics(category, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve trending fanfics",
			},
		})
		return
	}

	c.JSON(http.StatusOK, fanfics)
}

// Publish publishes a draft fanfic
func (h *FanficHandler) Publish(c *gin.Context) {
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

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	err = h.service.PublishFanfic(id, user.ID)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "PUBLISH_ERROR"

		if errors.Is(err, fanfic.ErrFanficNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		} else if errors.Is(err, fanfic.ErrUnauthorized) {
			statusCode = http.StatusForbidden
			code = "FORBIDDEN"
		} else if errors.Is(err, fanfic.ErrPublishValidation) {
			code = "VALIDATION_ERROR"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Fanfic published successfully"})
}

// Unpublish unpublishes a published fanfic (returns it to draft mode)
func (h *FanficHandler) Unpublish(c *gin.Context) {
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

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	err = h.service.UnpublishFanfic(id, user.ID)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "UNPUBLISH_ERROR"

		if errors.Is(err, fanfic.ErrFanficNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		} else if errors.Is(err, fanfic.ErrUnauthorized) {
			statusCode = http.StatusForbidden
			code = "FORBIDDEN"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Fanfic unpublished successfully"})
}

// UploadCover — POST /api/fanfics/:id/cover
func (h *FanficHandler) UploadCover(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"}})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid fanfic ID"}})
		return
	}

	fanficData, err := h.service.GetFanfic(id)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Fanfic not found"}})
		return
	}
	if fanficData.AuthorID != user.ID {
		c.JSON(http.StatusForbidden, ErrorResponse{Error: ErrorDetail{Code: "FORBIDDEN", Message: "Sem permissão"}})
		return
	}

	file, header, err := c.Request.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "UPLOAD_ERROR", Message: "Arquivo não encontrado"}})
		return
	}
	defer file.Close()

	if header.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "UPLOAD_ERROR", Message: "Arquivo muito grande (máximo 5MB)"}})
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	mimeByExt := map[string]string{".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif"}
	contentType, ok := mimeByExt[ext]
	if !ok {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "UPLOAD_ERROR", Message: "Formato não suportado (jpg, png, webp, gif)"}})
		return
	}

	key := fmt.Sprintf("fanfic-covers/%d_%d%s", id, time.Now().UnixNano(), ext)
	coverURL, err := h.store.Upload(c.Request.Context(), key, file, header.Size, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "UPLOAD_ERROR", Message: err.Error()}})
		return
	}

	if err := h.db.Table("fanfics").Where("id = ?", id).Update("cover_url", coverURL).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao salvar capa no banco"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"cover_url": coverURL})
}

