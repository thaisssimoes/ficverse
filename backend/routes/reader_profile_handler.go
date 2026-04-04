package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

type ReaderProfileHandler struct {
	db *gorm.DB
}

func NewReaderProfileHandler(db *gorm.DB) *ReaderProfileHandler {
	return &ReaderProfileHandler{db: db}
}

// GetReaderProfile returns the current user's reader profile.
// GET /api/profile/reader-profile
func (h *ReaderProfileHandler) GetReaderProfile(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)

	var profile models.ReaderProfile
	err := h.db.Where("user_id = ?", user.ID).First(&profile).Error
	if err != nil {
		// Return empty profile if not created yet
		c.JSON(http.StatusOK, models.ReaderProfile{UserID: user.ID})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateReaderProfile saves or updates the current user's reader profile.
// PUT /api/profile/reader-profile
func (h *ReaderProfileHandler) UpdateReaderProfile(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)

	var req models.ReaderProfile
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_REQUEST", Message: err.Error()}})
		return
	}

	var profile models.ReaderProfile
	err := h.db.Where("user_id = ?", user.ID).First(&profile).Error
	if err != nil {
		// Create new profile
		profile = models.ReaderProfile{
			UserID:        user.ID,
			FirstName:     req.FirstName,
			LastName:      req.LastName,
			Nickname:      req.Nickname,
			EyeColor:      req.EyeColor,
			HairColor:     req.HairColor,
			FavoriteColor: req.FavoriteColor,
			FavoriteFood:  req.FavoriteFood,
		}
		if err := h.db.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to save profile"}})
			return
		}
	} else {
		// Update existing
		profile.FirstName = req.FirstName
		profile.LastName = req.LastName
		profile.Nickname = req.Nickname
		profile.EyeColor = req.EyeColor
		profile.HairColor = req.HairColor
		profile.FavoriteColor = req.FavoriteColor
		profile.FavoriteFood = req.FavoriteFood
		h.db.Save(&profile)
	}

	c.JSON(http.StatusOK, profile)
}

// GetStandardVariables returns the list of standard variable definitions.
// GET /api/profile/standard-variables (public — author needs this to build forms)
func (h *ReaderProfileHandler) GetStandardVariables(c *gin.Context) {
	c.JSON(http.StatusOK, models.StandardVariables)
}
