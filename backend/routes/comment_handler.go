package routes

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/comment"
	"github.com/interactive-fanfic-platform/fanfic"
	"gorm.io/gorm"
)

// CommentHandler handles comment endpoints
type CommentHandler struct {
	service       *comment.CommentService
	fanficService *fanfic.FanficService
}

// NewCommentHandler creates a new comment handler
func NewCommentHandler(db *gorm.DB) *CommentHandler {
	return &CommentHandler{
		service:       comment.NewCommentService(db),
		fanficService: fanfic.NewFanficService(db),
	}
}

// CreateCommentRequest represents comment creation request
type CreateCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

// ListFanficComments lists all comments for a fanfic
func (h *CommentHandler) ListFanficComments(c *gin.Context) {
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

	comments, err := h.service.ListFanficComments(fanficID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve comments",
			},
		})
		return
	}

	c.JSON(http.StatusOK, comments)
}

// ListChapterComments lists all comments for a chapter
func (h *CommentHandler) ListChapterComments(c *gin.Context) {
	chapterID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid chapter ID",
			},
		})
		return
	}

	comments, err := h.service.ListChapterComments(chapterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve comments",
			},
		})
		return
	}

	c.JSON(http.StatusOK, comments)
}

// CreateFanficComment creates a comment on a fanfic
func (h *CommentHandler) CreateFanficComment(c *gin.Context) {
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

	var req CreateCommentRequest
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

	// Create comment
	newComment, err := h.service.CreateComment(user.ID, fanficID, nil, req.Content)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "CREATION_ERROR"

		if errors.Is(err, comment.ErrContentRequired) {
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

	c.JSON(http.StatusCreated, newComment)
}

// CreateChapterComment creates a comment on a chapter
func (h *CommentHandler) CreateChapterComment(c *gin.Context) {
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

	chapterID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid chapter ID",
			},
		})
		return
	}

	var req CreateCommentRequest
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

	// TODO: Get fanfic ID from chapter
	// For now, we'll need to query the chapter to get the fanfic ID
	// This is a simplification - in production you'd want to optimize this
	fanficID := 0 // Placeholder

	// Create comment
	newComment, err := h.service.CreateComment(user.ID, fanficID, &chapterID, req.Content)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "CREATION_ERROR"

		if errors.Is(err, comment.ErrContentRequired) {
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

	c.JSON(http.StatusCreated, newComment)
}

// Delete deletes a comment
func (h *CommentHandler) Delete(c *gin.Context) {
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

	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid comment ID",
			},
		})
		return
	}

	// Get comment to find fanfic
	commentData, err := h.service.GetComment(commentID)
	if err != nil {
		if errors.Is(err, comment.ErrCommentNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Comment not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve comment",
			},
		})
		return
	}

	// Get fanfic to check ownership
	fanficData, err := h.fanficService.GetFanfic(commentData.FanficID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to verify permissions",
			},
		})
		return
	}

	// Delete comment (service will check authorization)
	err = h.service.DeleteComment(commentID, user.ID, fanficData.AuthorID)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "DELETE_ERROR"

		if errors.Is(err, comment.ErrCommentNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		} else if errors.Is(err, comment.ErrUnauthorized) {
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
