package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

// ReadingListHandler handles reading list endpoints
type ReadingListHandler struct {
	db *gorm.DB
}

// NewReadingListHandler creates a new reading list handler
func NewReadingListHandler(db *gorm.DB) *ReadingListHandler {
	return &ReadingListHandler{
		db: db,
	}
}

// ReadingListItem represents a fanfic in the user's reading list
type ReadingListItem struct {
	FanficID           int     `json:"fanfic_id"`
	FanficTitle        string  `json:"fanfic_title"`
	FanficCoverURL     string  `json:"fanfic_cover_url"`
	FanficCategory     string  `json:"fanfic_category"`
	FanficSynopsis     string  `json:"fanfic_synopsis"`
	LastChapterRead    int     `json:"last_chapter_read"`
	TotalChapters      int     `json:"total_chapters"`
	LastReadAt         string  `json:"last_read_at"`
	ProgressPercentage float64 `json:"progress_percentage"`
}

// GetReadingList retrieves the user's reading list
func (h *ReadingListHandler) GetReadingList(c *gin.Context) {
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

	// Query reading progress with fanfic details
	var readingProgress []models.ReadingProgress
	err := h.db.
		Preload("Fanfic").
		Where("user_id = ?", user.ID).
		Order("last_read_at DESC").
		Limit(20).
		Find(&readingProgress).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve reading list",
			},
		})
		return
	}

	// Build reading list items
	readingList := make([]ReadingListItem, 0, len(readingProgress))
	for _, progress := range readingProgress {
		// Count total chapters for this fanfic
		var totalChapters int64
		h.db.Model(&models.Chapter{}).Where("fanfic_id = ?", progress.FanficID).Count(&totalChapters)

		// Calculate progress percentage
		progressPercentage := 0.0
		if totalChapters > 0 {
			progressPercentage = (float64(progress.LastChapterRead) / float64(totalChapters)) * 100
		}

		readingList = append(readingList, ReadingListItem{
			FanficID:           progress.Fanfic.ID,
			FanficTitle:        progress.Fanfic.Title,
			FanficCoverURL:     progress.Fanfic.CoverURL,
			FanficCategory:     progress.Fanfic.Category,
			FanficSynopsis:     progress.Fanfic.Synopsis,
			LastChapterRead:    progress.LastChapterRead,
			TotalChapters:      int(totalChapters),
			LastReadAt:         progress.LastReadAt.Format("2006-01-02T15:04:05Z07:00"),
			ProgressPercentage: progressPercentage,
		})
	}

	c.JSON(http.StatusOK, readingList)
}
