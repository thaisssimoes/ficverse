package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

type FavoriteHandler struct {
	db *gorm.DB
}

func NewFavoriteHandler(db *gorm.DB) *FavoriteHandler {
	return &FavoriteHandler{db: db}
}

// ToggleFavorite adds or removes a fanfic from the user's favorites
// POST /api/fanfics/:id/favorite
func (h *FavoriteHandler) ToggleFavorite(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)

	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid fanfic ID"}})
		return
	}

	// Check if fanfic exists
	var fanfic models.Fanfic
	if err := h.db.First(&fanfic, fanficID).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Fanfic not found"}})
		return
	}

	// Check if already favorited
	var existing models.FanficFavorite
	err = h.db.Where("user_id = ? AND fanfic_id = ?", user.ID, fanficID).First(&existing).Error

	if err == nil {
		// Already favorited — remove it
		h.db.Delete(&existing)
		count := h.getFavoriteCount(fanficID)
		c.JSON(http.StatusOK, gin.H{"favorited": false, "favorites_count": count})
		return
	}

	// Not favorited — add it
	favorite := models.FanficFavorite{
		UserID:   user.ID,
		FanficID: fanficID,
	}
	if err := h.db.Create(&favorite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to add favorite"}})
		return
	}

	count := h.getFavoriteCount(fanficID)
	c.JSON(http.StatusOK, gin.H{"favorited": true, "favorites_count": count})
}

// GetFavoriteStatus checks if the current user has favorited a fanfic
// GET /api/fanfics/:id/favorite
func (h *FavoriteHandler) GetFavoriteStatus(c *gin.Context) {
	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid fanfic ID"}})
		return
	}

	count := h.getFavoriteCount(fanficID)

	user, authenticated := auth.GetCurrentUser(c)
	if !authenticated {
		c.JSON(http.StatusOK, gin.H{"favorited": false, "favorites_count": count})
		return
	}

	var existing models.FanficFavorite
	err = h.db.Where("user_id = ? AND fanfic_id = ?", user.ID, fanficID).First(&existing).Error
	favorited := err == nil

	c.JSON(http.StatusOK, gin.H{"favorited": favorited, "favorites_count": count})
}

// GetUserFavorites returns all fanfics favorited by the current user
// GET /api/favorites
func (h *FavoriteHandler) GetUserFavorites(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)

	var favorites []models.FanficFavorite
	if err := h.db.Where("user_id = ?", user.ID).
		Preload("Fanfic").
		Preload("Fanfic.Author").
		Order("created_at DESC").
		Find(&favorites).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to get favorites"}})
		return
	}

	// Extract just the fanfics
	fanfics := make([]models.Fanfic, 0, len(favorites))
	for _, fav := range favorites {
		fanfics = append(fanfics, fav.Fanfic)
	}

	c.JSON(http.StatusOK, fanfics)
}

func (h *FavoriteHandler) getFavoriteCount(fanficID int) int64 {
	var count int64
	h.db.Model(&models.FanficFavorite{}).Where("fanfic_id = ?", fanficID).Count(&count)
	return count
}
