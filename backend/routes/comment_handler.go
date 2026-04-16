package routes

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/chapter"
	"github.com/interactive-fanfic-platform/comment"
	"github.com/interactive-fanfic-platform/fanfic"
	"gorm.io/gorm"
)

// CommentHandler handles comment endpoints
type CommentHandler struct {
	service        *comment.CommentService
	fanficService  *fanfic.FanficService
	chapterService *chapter.ChapterService
	emailService   *auth.EmailService
}

// NewCommentHandler creates a new comment handler
func NewCommentHandler(db *gorm.DB, emailService *auth.EmailService) *CommentHandler {
	return &CommentHandler{
		service:        comment.NewCommentService(db),
		fanficService:  fanfic.NewFanficService(db),
		chapterService: chapter.NewChapterService(db),
		emailService:   emailService,
	}
}

// CreateCommentRequest represents comment creation request
type CreateCommentRequest struct {
	Content  string `json:"content" binding:"required"`
	ParentID *int   `json:"parent_id"`
}

// ListFanficComments lists all comments for a fanfic, enriching liked_by_me when autenticado.
func (h *CommentHandler) ListFanficComments(c *gin.Context) {
	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid fanfic ID"}})
		return
	}

	comments, err := h.service.ListFanficComments(fanficID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to retrieve comments"}})
		return
	}

	if user, ok := auth.GetCurrentUser(c); ok {
		comments, _ = h.service.EnrichWithLikes(user.ID, comments)
	}

	c.JSON(http.StatusOK, comments)
}

// ListChapterComments lists all comments for a chapter, enriching liked_by_me quando autenticado.
func (h *CommentHandler) ListChapterComments(c *gin.Context) {
	chapterID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid chapter ID"}})
		return
	}

	comments, err := h.service.ListChapterComments(chapterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to retrieve comments"}})
		return
	}

	if user, ok := auth.GetCurrentUser(c); ok {
		comments, _ = h.service.EnrichWithLikes(user.ID, comments)
	}

	c.JSON(http.StatusOK, comments)
}

// CreateFanficComment creates a comment on a fanfic
func (h *CommentHandler) CreateFanficComment(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"}})
		return
	}

	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid fanfic ID"}})
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "VALIDATION_ERROR", Message: "Invalid input data"}})
		return
	}

	newComment, err := h.service.CreateComment(user.ID, fanficID, nil, req.ParentID, req.Content)
	if err != nil {
		code := "CREATION_ERROR"
		if errors.Is(err, comment.ErrContentRequired) {
			code = "CONTENT_REQUIRED"
		}
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: code, Message: err.Error()}})
		return
	}

	c.JSON(http.StatusCreated, newComment)
}

// CreateChapterComment creates a comment on a chapter
func (h *CommentHandler) CreateChapterComment(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"}})
		return
	}

	chapterID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid chapter ID"}})
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "VALIDATION_ERROR", Message: "Invalid input data"}})
		return
	}

	chapterData, err := h.chapterService.GetChapter(chapterID, 0)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Chapter not found"}})
		return
	}

	newComment, err := h.service.CreateComment(user.ID, chapterData.FanficID, &chapterID, req.ParentID, req.Content)
	if err != nil {
		code := "CREATION_ERROR"
		if errors.Is(err, comment.ErrContentRequired) {
			code = "CONTENT_REQUIRED"
		}
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: code, Message: err.Error()}})
		return
	}

	c.JSON(http.StatusCreated, newComment)
}

// Update edits the content of a comment (only the comment author can do this)
func (h *CommentHandler) Update(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"}})
		return
	}

	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid comment ID"}})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "VALIDATION_ERROR", Message: "Content is required"}})
		return
	}

	updated, err := h.service.UpdateComment(commentID, user.ID, req.Content)
	if err != nil {
		if errors.Is(err, comment.ErrCommentNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Comment not found"}})
			return
		}
		if errors.Is(err, comment.ErrNotOwner) {
			c.JSON(http.StatusForbidden, ErrorResponse{Error: ErrorDetail{Code: "FORBIDDEN", Message: err.Error()}})
			return
		}
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "UPDATE_ERROR", Message: err.Error()}})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// Delete deletes a comment
func (h *CommentHandler) Delete(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"}})
		return
	}

	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid comment ID"}})
		return
	}

	commentData, err := h.service.GetComment(commentID)
	if err != nil {
		if errors.Is(err, comment.ErrCommentNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Comment not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to retrieve comment"}})
		return
	}

	fanficData, err := h.fanficService.GetFanfic(commentData.FanficID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to verify permissions"}})
		return
	}

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
		c.JSON(statusCode, ErrorResponse{Error: ErrorDetail{Code: code, Message: err.Error()}})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ToggleLike alterna o like do usuário autenticado num comentário.
// POST /comments/:id/like → { liked: bool, likes_count: int }
func (h *CommentHandler) ToggleLike(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"}})
		return
	}

	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid comment ID"}})
		return
	}

	liked, count, err := h.service.ToggleLike(user.ID, commentID)
	if err != nil {
		if errors.Is(err, comment.ErrCommentNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Comment not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "LIKE_ERROR", Message: err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"liked": liked, "likes_count": count})
}

// ReportComment registra uma denúncia de um usuário para um comentário.
// POST /comments/:id/report  { reason: "spam" | "ofensivo" | "outro" }
func (h *CommentHandler) ReportComment(c *gin.Context) {
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrorDetail{Code: "UNAUTHORIZED", Message: "Authentication required"}})
		return
	}

	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid comment ID"}})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "VALIDATION_ERROR", Message: "Reason is required"}})
		return
	}

	commentData, err := h.service.GetComment(commentID)
	if err != nil {
		if errors.Is(err, comment.ErrCommentNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Comment not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to retrieve comment"}})
		return
	}

	err = h.service.ReportComment(user.ID, commentID, req.Reason)
	if err != nil {
		if errors.Is(err, comment.ErrAlreadyReported) {
			c.JSON(http.StatusConflict, ErrorResponse{Error: ErrorDetail{Code: "ALREADY_REPORTED", Message: "You already reported this comment"}})
			return
		}
		if errors.Is(err, comment.ErrCommentNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Comment not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "REPORT_ERROR", Message: err.Error()}})
		return
	}

	// Envia email de notificação para o email oficial do site em background.
	if h.emailService.IsConfigured() {
		go func() {
			if sendErr := h.emailService.SendCommentReport(user.Username, commentID, commentData.Content, req.Reason); sendErr != nil {
				// Apenas loga — falha no envio não deve afetar a resposta ao usuário.
				_ = sendErr
			}
		}()
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Denúncia registrada."})
}
