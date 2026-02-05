package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/fanfic"
	"gorm.io/gorm"
)

// SearchHandler handles search endpoints
type SearchHandler struct {
	fanficService *fanfic.FanficService
}

// NewSearchHandler creates a new search handler
func NewSearchHandler(db *gorm.DB) *SearchHandler {
	return &SearchHandler{
		fanficService: fanfic.NewFanficService(db),
	}
}

// SearchSuggestion represents a search suggestion response
type SearchSuggestion struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
}

// GetSuggestions returns search suggestions based on query
func (h *SearchHandler) GetSuggestions(c *gin.Context) {
	query := c.Query("q")
	
	if query == "" {
		c.JSON(http.StatusOK, []SearchSuggestion{})
		return
	}
	
	// Search fanfics with limit of 5 suggestions
	fanfics, err := h.fanficService.SearchFanfics(query, 5)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "SEARCH_ERROR",
				Message: "Failed to fetch search suggestions",
			},
		})
		return
	}
	
	// Convert to suggestions
	suggestions := make([]SearchSuggestion, len(fanfics))
	for i, fanfic := range fanfics {
		suggestions[i] = SearchSuggestion{
			ID:    fanfic.ID,
			Title: fanfic.Title,
		}
	}
	
	c.JSON(http.StatusOK, suggestions)
}

// Search returns full search results
func (h *SearchHandler) Search(c *gin.Context) {
	query := c.Query("q")
	
	if query == "" {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	
	// Search fanfics with limit of 50 results
	fanfics, err := h.fanficService.SearchFanfics(query, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "SEARCH_ERROR",
				Message: "Failed to search fanfics",
			},
		})
		return
	}
	
	c.JSON(http.StatusOK, fanfics)
}
