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
	"github.com/interactive-fanfic-platform/chapter"
	"github.com/interactive-fanfic-platform/fanfic"
	"github.com/interactive-fanfic-platform/models"
	"github.com/interactive-fanfic-platform/storage"
	"gorm.io/gorm"
)

// ChapterHandler handles chapter endpoints
type ChapterHandler struct {
	service       *chapter.ChapterService
	fanficService *fanfic.FanficService
	db            *gorm.DB
	store         storage.StorageService
}

// NewChapterHandler creates a new chapter handler
func NewChapterHandler(db *gorm.DB, store storage.StorageService) *ChapterHandler {
	return &ChapterHandler{
		service:       chapter.NewChapterService(db),
		fanficService: fanfic.NewFanficService(db),
		db:            db,
		store:         store,
	}
}

// CreateChapterRequest represents chapter creation request
type CreateChapterRequest struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
	IsDraft bool   `json:"is_draft"`
}

// UpdateChapterRequest represents chapter update request
type UpdateChapterRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	IsDraft *bool  `json:"is_draft"`
}

// ReorderChaptersRequest represents chapter reordering request
type ReorderChaptersRequest struct {
	ChapterIDs []int `json:"chapter_ids" binding:"required"`
}

// ListByFanfic lists all chapters for a fanfic
func (h *ChapterHandler) ListByFanfic(c *gin.Context) {
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

	// Get current user ID (0 if not authenticated)
	userID := 0
	if user, exists := auth.GetCurrentUser(c); exists {
		userID = user.ID
	}

	chapters, err := h.service.ListChapters(fanficID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve chapters",
			},
		})
		return
	}

	if userID != 0 {
		chapters, _ = h.service.EnrichWithLikes(userID, chapters)
	}

	c.JSON(http.StatusOK, chapters)
}

// GetByID retrieves a chapter by ID
func (h *ChapterHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid chapter ID",
			},
		})
		return
	}

	// Get current user ID (0 if not authenticated)
	userID := 0
	if user, exists := auth.GetCurrentUser(c); exists {
		userID = user.ID
	}

	chapterData, err := h.service.GetChapter(id, userID)
	if err != nil {
		if errors.Is(err, chapter.ErrChapterNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Chapter not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve chapter",
			},
		})
		return
	}

	if userID != 0 {
		liked, _ := h.service.EnrichWithLikes(userID, []models.Chapter{*chapterData})
		if len(liked) > 0 {
			chapterData = &liked[0]
		}
	}

	c.JSON(http.StatusOK, chapterData)
}

// Create creates a new chapter
func (h *ChapterHandler) Create(c *gin.Context) {
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

	// Verify user owns the fanfic
	fanficData, err := h.fanficService.GetFanfic(fanficID)
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
				Message: "Failed to verify fanfic ownership",
			},
		})
		return
	}

	if fanficData.AuthorID != user.ID {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error: ErrorDetail{
				Code:    "FORBIDDEN",
				Message: "You don't have permission to add chapters to this fanfic",
			},
		})
		return
	}

	var req CreateChapterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid input data",
				Details: []FieldError{
					{Field: "body", Message: err.Error()},
				},
			},
		})
		return
	}

	// Create chapter with draft status from request
	newChapter, err := h.service.CreateChapter(fanficID, req.Title, req.Content, req.IsDraft)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "CREATION_ERROR"

		if errors.Is(err, chapter.ErrTitleRequired) {
			code = "TITLE_REQUIRED"
		} else if errors.Is(err, chapter.ErrContentRequired) {
			code = "CONTENT_REQUIRED"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, newChapter)
}

// Update updates a chapter
func (h *ChapterHandler) Update(c *gin.Context) {
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
				Message: "Invalid chapter ID",
			},
		})
		return
	}

	// Get chapter to verify ownership (use user ID for authorization check)
	chapterData, err := h.service.GetChapter(id, user.ID)
	if err != nil {
		if errors.Is(err, chapter.ErrChapterNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Chapter not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve chapter",
			},
		})
		return
	}

	// Verify user owns the fanfic
	fanficData, err := h.fanficService.GetFanfic(chapterData.FanficID)
	if err != nil {
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
				Message: "You don't have permission to update this chapter",
			},
		})
		return
	}

	var req UpdateChapterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid input data",
				Details: []FieldError{
					{Field: "body", Message: err.Error()},
				},
			},
		})
		return
	}

	// Update chapter
	updatedChapter, err := h.service.UpdateChapter(id, req.Title, req.Content, req.IsDraft)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "UPDATE_ERROR"

		if errors.Is(err, chapter.ErrChapterNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, updatedChapter)
}

// Delete deletes a chapter
func (h *ChapterHandler) Delete(c *gin.Context) {
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
				Message: "Invalid chapter ID",
			},
		})
		return
	}

	// Get chapter to verify ownership (use user ID for authorization check)
	chapterData, err := h.service.GetChapter(id, user.ID)
	if err != nil {
		if errors.Is(err, chapter.ErrChapterNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Chapter not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve chapter",
			},
		})
		return
	}

	// Verify user owns the fanfic
	fanficData, err := h.fanficService.GetFanfic(chapterData.FanficID)
	if err != nil {
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
				Message: "You don't have permission to delete this chapter",
			},
		})
		return
	}

	err = h.service.DeleteChapter(id)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "DELETE_ERROR"

		if errors.Is(err, chapter.ErrChapterNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
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

// Reorder reorders chapters for a fanfic
func (h *ChapterHandler) Reorder(c *gin.Context) {
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

	// Verify user owns the fanfic
	fanficData, err := h.fanficService.GetFanfic(fanficID)
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
				Message: "Failed to verify fanfic ownership",
			},
		})
		return
	}

	if fanficData.AuthorID != user.ID {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error: ErrorDetail{
				Code:    "FORBIDDEN",
				Message: "You don't have permission to reorder chapters for this fanfic",
			},
		})
		return
	}

	var req ReorderChaptersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid input data",
				Details: []FieldError{
					{Field: "body", Message: err.Error()},
				},
			},
		})
		return
	}

	// Reorder chapters
	err = h.service.ReorderChapters(fanficID, req.ChapterIDs)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "REORDER_ERROR"

		if errors.Is(err, chapter.ErrChapterNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chapters reordered successfully"})
}

// Publish publishes a draft chapter
func (h *ChapterHandler) Publish(c *gin.Context) {
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
				Message: "Invalid chapter ID",
			},
		})
		return
	}

	// Get chapter to verify ownership (use user ID for authorization check)
	chapterData, err := h.service.GetChapter(id, user.ID)
	if err != nil {
		if errors.Is(err, chapter.ErrChapterNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Chapter not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve chapter",
			},
		})
		return
	}

	// Verify user owns the fanfic
	fanficData, err := h.fanficService.GetFanfic(chapterData.FanficID)
	if err != nil {
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
				Message: "You don't have permission to publish this chapter",
			},
		})
		return
	}

	// Publish chapter
	err = h.service.PublishChapter(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "PUBLISH_ERROR",
				Message: "Failed to publish chapter",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chapter published successfully"})
}

// UploadCover — POST /api/chapters/:id/cover
func (h *ChapterHandler) UploadCover(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"}})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid chapter ID"}})
		return
	}

	chapterData, err := h.service.GetChapter(id, user.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Chapter not found"}})
		return
	}

	fanficData, err := h.fanficService.GetFanfic(chapterData.FanficID)
	if err != nil || fanficData.AuthorID != user.ID {
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

	key := fmt.Sprintf("chapter-covers/%d_%d%s", id, time.Now().UnixNano(), ext)
	coverURL, err := h.store.Upload(c.Request.Context(), key, file, header.Size, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "UPLOAD_ERROR", Message: "Erro ao fazer upload da imagem"}})
		return
	}

	if err := h.db.Table("chapters").Where("id = ?", id).Update("cover_url", coverURL).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao salvar capa"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"cover_url": coverURL})
}

// IncrementViews incrementa o contador de visualizações de um capítulo.
// POST /chapters/:id/view — não requer autenticação.
func (h *ChapterHandler) IncrementViews(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid chapter ID"}})
		return
	}
	if err := h.service.IncrementViews(id); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ToggleChapterLike alterna o like do usuário autenticado num capítulo.
// POST /chapters/:id/like → { liked: bool, likes_count: int }
func (h *ChapterHandler) ToggleChapterLike(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"}})
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid chapter ID"}})
		return
	}
	liked, count, err := h.service.ToggleLike(user.ID, id)
	if err != nil {
		if errors.Is(err, chapter.ErrChapterNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Chapter not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "LIKE_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"liked": liked, "likes_count": count})
}
