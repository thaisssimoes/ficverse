package routes

import (
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/fanfic"
	"gorm.io/gorm"
)

// FanficHandler handles fanfic endpoints
type FanficHandler struct {
	service *fanfic.FanficService
}

// NewFanficHandler creates a new fanfic handler
func NewFanficHandler(db *gorm.DB) *FanficHandler {
	return &FanficHandler{
		service: fanfic.NewFanficService(db),
	}
}

// CreateFanficRequest represents fanfic creation request
type CreateFanficRequest struct {
	Title           string `form:"title" binding:"required"`
	Synopsis        string `form:"synopsis" binding:"required"`
	Disclaimer      string `form:"disclaimer"`
	Category        string `form:"category" binding:"required"`
	InteractiveMode string `form:"interactive_mode"`
	IsDraft         string `form:"is_draft"`
	IsAdultContent  string `form:"is_adult_content"`
	TriggerWarnings string `form:"trigger_warnings"`
}

// UpdateFanficRequest represents fanfic update request
type UpdateFanficRequest struct {
	Title           string `form:"title"`
	Synopsis        string `form:"synopsis"`
	Disclaimer      string `form:"disclaimer"`
	Category        string `form:"category"`
	InteractiveMode string `form:"interactive_mode"`
	IsAdultContent  string `form:"is_adult_content"`
	TriggerWarnings string `form:"trigger_warnings"`
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

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "PARSE_ERROR",
				Message: "Failed to parse form data",
			},
		})
		return
	}

	// Get form values
	title := c.PostForm("title")
	synopsis := c.PostForm("synopsis")
	disclaimer := c.PostForm("disclaimer")
	category := c.PostForm("category")
	interactiveModeStr := c.PostForm("interactive_mode")
	isDraftStr := c.PostForm("is_draft")
	isAdultContentStr := c.PostForm("is_adult_content")
	triggerWarnings := c.PostForm("trigger_warnings")

	// Validate required fields
	if title == "" || synopsis == "" || category == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Title, synopsis, and category are required",
			},
		})
		return
	}

	// Handle cover image upload
	var coverData []byte
	var coverFilename string
	file, header, err := c.Request.FormFile("cover")
	if err == nil {
		defer file.Close()
		coverFilename = header.Filename
		coverData, err = io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: ErrorDetail{
					Code:    "FILE_READ_ERROR",
					Message: "Failed to read cover image",
				},
			})
			return
		}
	}

	// Parse interactive mode
	interactiveMode := interactiveModeStr == "true"

	// Parse is_draft (optional, defaults to true in service)
	var isDraftPtr *bool
	if isDraftStr != "" {
		isDraft := isDraftStr == "true"
		isDraftPtr = &isDraft
	}

	// Parse is_adult_content (defaults to false)
	isAdultContent := isAdultContentStr == "true"

	// Create fanfic
	newFanfic, err := h.service.CreateFanfic(
		user.ID,
		title,
		synopsis,
		disclaimer,
		category,
		coverFilename,
		coverData,
		interactiveMode,
		isDraftPtr,
		isAdultContent,
		triggerWarnings,
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
		} else if errors.Is(err, fanfic.ErrInvalidImageFormat) {
			code = "INVALID_IMAGE_FORMAT"
		} else if errors.Is(err, fanfic.ErrImageTooLarge) {
			code = "IMAGE_TOO_LARGE"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, newFanfic)
}

// Update updates a fanfic
func (h *FanficHandler) Update(c *gin.Context) {
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

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "PARSE_ERROR",
				Message: "Failed to parse form data",
			},
		})
		return
	}

	// Get form values
	title := c.PostForm("title")
	synopsis := c.PostForm("synopsis")
	disclaimer := c.PostForm("disclaimer")
	category := c.PostForm("category")
	interactiveModeStr := c.PostForm("interactive_mode")
	isAdultContentStr := c.PostForm("is_adult_content")
	triggerWarnings := c.PostForm("trigger_warnings")

	// Handle cover image upload
	var coverData []byte
	var coverFilename string
	file, header, err := c.Request.FormFile("cover")
	if err == nil {
		defer file.Close()
		coverFilename = header.Filename
		coverData, err = io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: ErrorDetail{
					Code:    "FILE_READ_ERROR",
					Message: "Failed to read cover image",
				},
			})
			return
		}
	}

	// Parse interactive mode (only update if provided)
	var interactiveModePtr *bool
	if interactiveModeStr != "" {
		interactiveMode := interactiveModeStr == "true"
		interactiveModePtr = &interactiveMode
	}

	// Parse is_adult_content (only update if provided)
	var isAdultContentPtr *bool
	if isAdultContentStr != "" {
		isAdultContent := isAdultContentStr == "true"
		isAdultContentPtr = &isAdultContent
	}

	// Update fanfic
	updatedFanfic, err := h.service.UpdateFanfic(
		id,
		user.ID,
		title,
		synopsis,
		disclaimer,
		category,
		coverFilename,
		coverData,
		interactiveModePtr,
		isAdultContentPtr,
		triggerWarnings,
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
		} else if errors.Is(err, fanfic.ErrInvalidImageFormat) {
			code = "INVALID_IMAGE_FORMAT"
		} else if errors.Is(err, fanfic.ErrImageTooLarge) {
			code = "IMAGE_TOO_LARGE"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
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
