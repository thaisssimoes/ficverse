package routes

import (
	"net/http"
	"strconv"

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

// ListProfiles returns all profiles for the current user.
// GET /api/profile/profiles
func (h *ReaderProfileHandler) ListProfiles(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)

	var profiles []models.ReaderProfile
	h.db.Where("user_id = ?", user.ID).Order("created_at asc").Find(&profiles)
	c.JSON(http.StatusOK, profiles)
}

// CreateProfile creates a new named profile for the current user.
// POST /api/profile/profiles
func (h *ReaderProfileHandler) CreateProfile(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)

	var req models.ReaderProfile
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_REQUEST", Message: err.Error()}})
		return
	}

	if req.Name == "" {
		req.Name = "Perfil Principal"
	}

	profile := models.ReaderProfile{
		UserID:        user.ID,
		Name:          req.Name,
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		Nickname:      req.Nickname,
		EyeColor:      req.EyeColor,
		HairColor:     req.HairColor,
		FavoriteColor: req.FavoriteColor,
		FavoriteFood:  req.FavoriteFood,
		Age:           req.Age,
	}

	if err := h.db.Create(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to create profile"}})
		return
	}

	c.JSON(http.StatusCreated, profile)
}

// UpdateProfile updates a specific profile by ID.
// PUT /api/profile/profiles/:id
func (h *ReaderProfileHandler) UpdateProfile(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid profile ID"}})
		return
	}

	var profile models.ReaderProfile
	if err := h.db.Where("id = ? AND user_id = ?", profileID, user.ID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Profile not found"}})
		return
	}

	var req models.ReaderProfile
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_REQUEST", Message: err.Error()}})
		return
	}

	if req.Name != "" {
		profile.Name = req.Name
	}
	profile.FirstName = req.FirstName
	profile.LastName = req.LastName
	profile.Nickname = req.Nickname
	profile.EyeColor = req.EyeColor
	profile.HairColor = req.HairColor
	profile.FavoriteColor = req.FavoriteColor
	profile.FavoriteFood = req.FavoriteFood
	profile.Age = req.Age

	h.db.Save(&profile)
	c.JSON(http.StatusOK, profile)
}

// DeleteProfile deletes a specific profile by ID.
// DELETE /api/profile/profiles/:id
func (h *ReaderProfileHandler) DeleteProfile(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "Invalid profile ID"}})
		return
	}

	result := h.db.Where("id = ? AND user_id = ?", profileID, user.ID).Delete(&models.ReaderProfile{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Profile not found"}})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetReaderProfile returns the first (default) profile — kept for backward compat.
// GET /api/profile/reader-profile
func (h *ReaderProfileHandler) GetReaderProfile(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)

	var profile models.ReaderProfile
	err := h.db.Where("user_id = ?", user.ID).Order("created_at asc").First(&profile).Error
	if err != nil {
		c.JSON(http.StatusOK, models.ReaderProfile{UserID: user.ID, Name: "Perfil Principal"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateReaderProfile saves or updates the default (first) profile — backward compat.
// PUT /api/profile/reader-profile
func (h *ReaderProfileHandler) UpdateReaderProfile(c *gin.Context) {
	user, _ := auth.GetCurrentUser(c)

	var req models.ReaderProfile
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_REQUEST", Message: err.Error()}})
		return
	}

	var profile models.ReaderProfile
	err := h.db.Where("user_id = ?", user.ID).Order("created_at asc").First(&profile).Error
	if err != nil {
		profile = models.ReaderProfile{
			UserID:        user.ID,
			Name:          "Perfil Principal",
			FirstName:     req.FirstName,
			LastName:      req.LastName,
			Nickname:      req.Nickname,
			EyeColor:      req.EyeColor,
			HairColor:     req.HairColor,
			FavoriteColor: req.FavoriteColor,
			FavoriteFood:  req.FavoriteFood,
			Age:           req.Age,
		}
		if err := h.db.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DATABASE_ERROR", Message: "Failed to save profile"}})
			return
		}
	} else {
		profile.FirstName = req.FirstName
		profile.LastName = req.LastName
		profile.Nickname = req.Nickname
		profile.EyeColor = req.EyeColor
		profile.HairColor = req.HairColor
		profile.FavoriteColor = req.FavoriteColor
		profile.FavoriteFood = req.FavoriteFood
		profile.Age = req.Age
		h.db.Save(&profile)
	}

	c.JSON(http.StatusOK, profile)
}

// GetStandardVariables returns the list of standard variable definitions.
// GET /api/profile/standard-variables (public)
func (h *ReaderProfileHandler) GetStandardVariables(c *gin.Context) {
	c.JSON(http.StatusOK, models.StandardVariables)
}
