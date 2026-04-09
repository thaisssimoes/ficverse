package routes

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

// UserHandler handles user-related endpoints (public profile, avatar, banner, block)
type UserHandler struct {
	db          *gorm.DB
	authService *auth.AuthService
}

func NewUserHandler(db *gorm.DB, authService *auth.AuthService) *UserHandler {
	return &UserHandler{db: db, authService: authService}
}

// PublicProfileResponse is the public-facing profile payload
type PublicProfileResponse struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	Bio          string `json:"bio"`
	AvatarURL    string `json:"avatar_url"`
	BannerURL    string `json:"banner_url"`
	FanficsCount int64  `json:"fanfics_count"`
	IsBlocked    bool   `json:"is_blocked"`
}

// GetPublicProfile — GET /api/user/:username (no auth required)
func (h *UserHandler) GetPublicProfile(c *gin.Context) {
	username := c.Param("username")

	var user models.User
	if err := h.db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Usuário não encontrado"}})
		return
	}

	var count int64
	h.db.Model(&models.Fanfic{}).Where("author_id = ? AND is_draft = false", user.ID).Count(&count)

	isBlocked := false
	if callerID, exists := c.Get("user_id"); exists {
		var block models.UserBlock
		if err := h.db.Where("blocker_id = ? AND blocked_id = ?", callerID, user.ID).First(&block).Error; err == nil {
			isBlocked = true
		}
	}

	c.JSON(http.StatusOK, PublicProfileResponse{
		ID:           user.ID,
		Username:     user.Username,
		Bio:          user.Bio,
		AvatarURL:    user.AvatarURL,
		BannerURL:    user.BannerURL,
		FanficsCount: count,
		IsBlocked:    isBlocked,
	})
}

// GetCurrentUserProfile — GET /api/user/me
func (h *UserHandler) GetCurrentUserProfile(c *gin.Context) {
	userID := c.GetInt("user_id")

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Usuário não encontrado"}})
		return
	}

	var count int64
	h.db.Model(&models.Fanfic{}).Where("author_id = ?", userID).Count(&count)

	c.JSON(http.StatusOK, PublicProfileResponse{
		ID:           user.ID,
		Username:     user.Username,
		Bio:          user.Bio,
		AvatarURL:    user.AvatarURL,
		BannerURL:    user.BannerURL,
		FanficsCount: count,
	})
}

// UpdateBio — PUT /api/user/bio
func (h *UserHandler) UpdateBio(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req struct {
		Bio string `json:"bio" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "VALIDATION_ERROR", Message: "Bio é obrigatória"}})
		return
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", userID).Update("bio", req.Bio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao salvar bio"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Bio atualizada"})
}

// uploadImage is a shared helper for avatar and banner uploads
func (h *UserHandler) uploadImage(c *gin.Context, field string, maxSizeBytes int64) (string, error) {
	file, header, err := c.Request.FormFile(field)
	if err != nil {
		return "", fmt.Errorf("arquivo não encontrado: %w", err)
	}
	defer file.Close()

	if header.Size > maxSizeBytes {
		return "", fmt.Errorf("arquivo muito grande (máximo %dMB)", maxSizeBytes/1024/1024)
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowed[ext] {
		return "", fmt.Errorf("formato não suportado (use jpg, png ou webp)")
	}

	dir := "./uploads/" + field + "s"
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("erro ao criar diretório: %w", err)
	}

	userID := c.GetInt("user_id")
	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().UnixNano(), ext)
	dst := filepath.Join(dir, filename)

	out, err := os.Create(dst)
	if err != nil {
		return "", fmt.Errorf("erro ao salvar arquivo: %w", err)
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		return "", fmt.Errorf("erro ao gravar arquivo: %w", err)
	}

	return "/uploads/" + field + "s/" + filename, nil
}

// UploadAvatar — POST /api/user/avatar
func (h *UserHandler) UploadAvatar(c *gin.Context) {
	userID := c.GetInt("user_id")

	url, err := h.uploadImage(c, "avatar", 5*1024*1024)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "UPLOAD_ERROR", Message: err.Error()}})
		return
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao salvar avatar"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"avatar_url": url})
}

// UploadBanner — POST /api/user/banner
func (h *UserHandler) UploadBanner(c *gin.Context) {
	userID := c.GetInt("user_id")

	url, err := h.uploadImage(c, "banner", 10*1024*1024)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "UPLOAD_ERROR", Message: err.Error()}})
		return
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", userID).Update("banner_url", url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao salvar banner"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"banner_url": url})
}

// BlockUser — POST /api/user/:id/block
func (h *UserHandler) BlockUser(c *gin.Context) {
	blockerID := c.GetInt("user_id")
	blockedID, err := strconv.Atoi(c.Param("id"))
	if err != nil || blockedID == blockerID {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	block := models.UserBlock{BlockerID: blockerID, BlockedID: blockedID}
	if err := h.db.FirstOrCreate(&block, models.UserBlock{BlockerID: blockerID, BlockedID: blockedID}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao bloquear usuário"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Usuário bloqueado"})
}

// UnblockUser — DELETE /api/user/:id/block
func (h *UserHandler) UnblockUser(c *gin.Context) {
	blockerID := c.GetInt("user_id")
	blockedID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	if err := h.db.Where("blocker_id = ? AND blocked_id = ?", blockerID, blockedID).Delete(&models.UserBlock{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao desbloquear usuário"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Usuário desbloqueado"})
}
