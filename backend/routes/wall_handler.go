package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

// WallHandler handles mural (wall) endpoints
type WallHandler struct {
	db *gorm.DB
}

func NewWallHandler(db *gorm.DB) *WallHandler {
	return &WallHandler{db: db}
}

// GetWallMessages — GET /api/user/:id/wall
func (h *WallHandler) GetWallMessages(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	var messages []models.WallMessage
	if err := h.db.Where("profile_id = ?", profileID).
		Order("pinned DESC, created_at DESC").
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao buscar mensagens"}})
		return
	}

	// Populate author names
	authorIDs := make([]int, 0, len(messages))
	for _, m := range messages {
		authorIDs = append(authorIDs, m.AuthorID)
	}
	var authors []models.User
	h.db.Where("id IN ?", authorIDs).Find(&authors)
	authorMap := make(map[int]string, len(authors))
	for _, a := range authors {
		authorMap[a.ID] = a.Username
	}
	for i := range messages {
		messages[i].AuthorName = authorMap[messages[i].AuthorID]
	}

	c.JSON(http.StatusOK, messages)
}

// PostWallMessage — POST /api/user/:id/wall
func (h *WallHandler) PostWallMessage(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	authorID := c.GetInt("user_id")

	var req struct {
		Content string `json:"content" binding:"required,max=1000"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "VALIDATION_ERROR", Message: "Conteúdo obrigatório (máx. 1000 chars)"}})
		return
	}

	msg := models.WallMessage{
		ProfileID: profileID,
		AuthorID:  authorID,
		Content:   req.Content,
	}
	if err := h.db.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao salvar mensagem"}})
		return
	}

	// Populate author name for response
	var author models.User
	h.db.First(&author, authorID)
	msg.AuthorName = author.Username

	c.JSON(http.StatusCreated, msg)
}

// DeleteWallMessage — DELETE /api/wall/:msgId
// Allowed: message author OR profile owner
func (h *WallHandler) DeleteWallMessage(c *gin.Context) {
	msgID, err := strconv.Atoi(c.Param("msgId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	callerID := c.GetInt("user_id")

	var msg models.WallMessage
	if err := h.db.First(&msg, msgID).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Mensagem não encontrada"}})
		return
	}

	// Only author of message or profile owner can delete
	if msg.AuthorID != callerID && msg.ProfileID != callerID {
		c.JSON(http.StatusForbidden, ErrorResponse{Error: ErrorDetail{Code: "FORBIDDEN", Message: "Sem permissão"}})
		return
	}

	h.db.Delete(&msg)
	c.JSON(http.StatusNoContent, nil)
}

// PinWallMessage — PUT /api/wall/:msgId/pin
// Only the profile owner can pin/unpin
func (h *WallHandler) PinWallMessage(c *gin.Context) {
	msgID, err := strconv.Atoi(c.Param("msgId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	callerID := c.GetInt("user_id")

	var msg models.WallMessage
	if err := h.db.First(&msg, msgID).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Mensagem não encontrada"}})
		return
	}

	if msg.ProfileID != callerID {
		c.JSON(http.StatusForbidden, ErrorResponse{Error: ErrorDetail{Code: "FORBIDDEN", Message: "Sem permissão"}})
		return
	}

	msg.Pinned = !msg.Pinned
	h.db.Save(&msg)
	c.JSON(http.StatusOK, gin.H{"pinned": msg.Pinned})
}
