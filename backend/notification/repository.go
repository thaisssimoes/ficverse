package notification

import (
	"errors"
	"fmt"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrNotificationNotFound = errors.New("notification not found")
)

// NotificationRepository handles database operations for notifications
type NotificationRepository struct {
	db *gorm.DB
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create creates a new notification
func (r *NotificationRepository) Create(notification *models.Notification) error {
	result := r.db.Create(notification)
	if result.Error != nil {
		return fmt.Errorf("failed to create notification: %w", result.Error)
	}
	return nil
}

// GetByUserID retrieves all notifications for a user
func (r *NotificationRepository) GetByUserID(userID int, limit int) ([]models.Notification, error) {
	var notifications []models.Notification
	query := r.db.Where("user_id = ?", userID).
		Preload("Actor").
		Order("created_at DESC")
	
	if limit > 0 {
		query = query.Limit(limit)
	}
	
	result := query.Find(&notifications)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get notifications: %w", result.Error)
	}
	return notifications, nil
}

// GetUnreadByUserID retrieves unread notifications for a user
func (r *NotificationRepository) GetUnreadByUserID(userID int) ([]models.Notification, error) {
	var notifications []models.Notification
	result := r.db.Where("user_id = ? AND is_read = ?", userID, false).
		Preload("Actor").
		Order("created_at DESC").
		Find(&notifications)
	
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get unread notifications: %w", result.Error)
	}
	return notifications, nil
}

// CountUnreadByUserID counts unread notifications for a user
func (r *NotificationRepository) CountUnreadByUserID(userID int) (int64, error) {
	var count int64
	result := r.db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count)
	
	if result.Error != nil {
		return 0, fmt.Errorf("failed to count unread notifications: %w", result.Error)
	}
	return count, nil
}

// MarkAsRead marks a notification as read
func (r *NotificationRepository) MarkAsRead(notificationID int, userID int) error {
	result := r.db.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true)
	
	if result.Error != nil {
		return fmt.Errorf("failed to mark notification as read: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotificationNotFound
	}
	return nil
}

// MarkAllAsRead marks all notifications as read for a user
func (r *NotificationRepository) MarkAllAsRead(userID int) error {
	result := r.db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true)
	
	if result.Error != nil {
		return fmt.Errorf("failed to mark all notifications as read: %w", result.Error)
	}
	return nil
}

// Delete deletes a notification
func (r *NotificationRepository) Delete(notificationID int, userID int) error {
	result := r.db.Where("id = ? AND user_id = ?", notificationID, userID).
		Delete(&models.Notification{})
	
	if result.Error != nil {
		return fmt.Errorf("failed to delete notification: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotificationNotFound
	}
	return nil
}
