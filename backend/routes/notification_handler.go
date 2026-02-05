package routes

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/notification"
	"gorm.io/gorm"
)

// NotificationHandler handles notification endpoints
type NotificationHandler struct {
	service *notification.NotificationService
}

// NewNotificationHandler creates a new notification handler
func NewNotificationHandler(db *gorm.DB) *NotificationHandler {
	return &NotificationHandler{
		service: notification.NewNotificationService(db),
	}
}

// GetNotifications retrieves notifications for the authenticated user
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
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

	// Get limit from query parameter, default to 20
	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Get unread only flag
	unreadOnly := c.Query("unread") == "true"

	var notifications interface{}
	var err error

	if unreadOnly {
		notifications, err = h.service.GetUnreadNotifications(user.ID)
	} else {
		notifications, err = h.service.GetUserNotifications(user.ID, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve notifications",
			},
		})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

// GetUnreadCount retrieves the count of unread notifications
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
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

	count, err := h.service.GetUnreadCount(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to get unread count",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
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

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid notification ID",
			},
		})
		return
	}

	err = h.service.MarkAsRead(id, user.ID)
	if err != nil {
		if errors.Is(err, notification.ErrNotificationNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Notification not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to mark notification as read",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// MarkAllAsRead marks all notifications as read
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
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

	err := h.service.MarkAllAsRead(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to mark all notifications as read",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// Delete deletes a notification
func (h *NotificationHandler) Delete(c *gin.Context) {
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

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid notification ID",
			},
		})
		return
	}

	err = h.service.DeleteNotification(id, user.ID)
	if err != nil {
		if errors.Is(err, notification.ErrNotificationNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Notification not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to delete notification",
			},
		})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
