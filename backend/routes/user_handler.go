package routes

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/models"
	"github.com/interactive-fanfic-platform/storage"
	"gorm.io/gorm"
)

// UserHandler handles user-related endpoints (public profile, avatar, banner, block)
type UserHandler struct {
	db          *gorm.DB
	authService *auth.AuthService
	store       storage.StorageService
}

func NewUserHandler(db *gorm.DB, authService *auth.AuthService, store storage.StorageService) *UserHandler {
	return &UserHandler{db: db, authService: authService, store: store}
}

// PublicProfileResponse is the public-facing profile payload
type PublicProfileResponse struct {
	ID             int    `json:"id"`
	Username       string `json:"username"`
	Bio            string `json:"bio"`
	AvatarURL      string `json:"avatar_url"`
	BannerURL      string `json:"banner_url"`
	FanficsCount   int64  `json:"fanfics_count"`
	FollowersCount int64  `json:"followers_count"`
	IsBlocked      bool   `json:"is_blocked"`
	IsFollowing    bool   `json:"is_following"`
}

// GetPublicProfile — GET /api/user/:username (no auth required)
func (h *UserHandler) GetPublicProfile(c *gin.Context) {
	username := c.Param("username")

	var user models.User
	if err := h.db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Usuário não encontrado"}})
		return
	}

	var fanficsCount int64
	h.db.Model(&models.Fanfic{}).Where("author_id = ? AND is_draft = false", user.ID).Count(&fanficsCount)

	var followersCount int64
	h.db.Model(&models.UserFollow{}).Where("following_id = ?", user.ID).Count(&followersCount)

	isBlocked := false
	isFollowing := false
	if callerID, exists := c.Get("user_id"); exists {
		var block models.UserBlock
		if err := h.db.Where("blocker_id = ? AND blocked_id = ?", callerID, user.ID).First(&block).Error; err == nil {
			isBlocked = true
		}
		var follow models.UserFollow
		if err := h.db.Where("follower_id = ? AND following_id = ?", callerID, user.ID).First(&follow).Error; err == nil {
			isFollowing = true
		}
	}

	c.JSON(http.StatusOK, PublicProfileResponse{
		ID:             user.ID,
		Username:       user.Username,
		Bio:            user.Bio,
		AvatarURL:      user.AvatarURL,
		BannerURL:      user.BannerURL,
		FanficsCount:   fanficsCount,
		FollowersCount: followersCount,
		IsBlocked:      isBlocked,
		IsFollowing:    isFollowing,
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
	mimeByExt := map[string]string{".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
	contentType, ok := mimeByExt[ext]
	if !ok {
		return "", fmt.Errorf("formato não suportado (use jpg, png ou webp)")
	}

	userID := c.GetInt("user_id")
	key := fmt.Sprintf("%ss/%d_%d%s", field, userID, time.Now().UnixNano(), ext)

	url, err := h.store.Upload(c.Request.Context(), key, file, header.Size, contentType)
	if err != nil {
		return "", fmt.Errorf("erro ao fazer upload: %w", err)
	}

	return url, nil
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

// FollowUser — POST /api/user/:username/follow
func (h *UserHandler) FollowUser(c *gin.Context) {
	followerID := c.GetInt("user_id")
	followingID, err := strconv.Atoi(c.Param("username"))
	if err != nil || followingID == followerID {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}
	follow := models.UserFollow{FollowerID: followerID, FollowingID: followingID}
	if err := h.db.FirstOrCreate(&follow, follow).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao seguir usuário"}})
		return
	}
	var count int64
	h.db.Model(&models.UserFollow{}).Where("following_id = ?", followingID).Count(&count)
	c.JSON(http.StatusOK, gin.H{"following": true, "followers_count": count})
}

// UnfollowUser — DELETE /api/user/:username/follow
func (h *UserHandler) UnfollowUser(c *gin.Context) {
	followerID := c.GetInt("user_id")
	followingID, err := strconv.Atoi(c.Param("username"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}
	if err := h.db.Where("follower_id = ? AND following_id = ?", followerID, followingID).Delete(&models.UserFollow{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao deixar de seguir"}})
		return
	}
	var count int64
	h.db.Model(&models.UserFollow{}).Where("following_id = ?", followingID).Count(&count)
	c.JSON(http.StatusOK, gin.H{"following": false, "followers_count": count})
}

// GetFollowStatus — GET /api/user/:username/follow
func (h *UserHandler) GetFollowStatus(c *gin.Context) {
	followerID := c.GetInt("user_id")
	followingID, err := strconv.Atoi(c.Param("username"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}
	var follow models.UserFollow
	isFollowing := h.db.Where("follower_id = ? AND following_id = ?", followerID, followingID).First(&follow).Error == nil
	var count int64
	h.db.Model(&models.UserFollow{}).Where("following_id = ?", followingID).Count(&count)
	c.JSON(http.StatusOK, gin.H{"following": isFollowing, "followers_count": count})
}

// BlockUser — POST /api/user/:username/block
func (h *UserHandler) BlockUser(c *gin.Context) {
	blockerID := c.GetInt("user_id")
	blockedID, err := strconv.Atoi(c.Param("username"))
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

// UnblockUser — DELETE /api/user/:username/block
func (h *UserHandler) UnblockUser(c *gin.Context) {
	blockerID := c.GetInt("user_id")
	blockedID, err := strconv.Atoi(c.Param("username"))
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
