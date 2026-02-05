package notification

import (
	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

// NotificationService handles business logic for notifications
type NotificationService struct {
	repo *NotificationRepository
}

// NewNotificationService creates a new notification service
func NewNotificationService(db *gorm.DB) *NotificationService {
	return &NotificationService{
		repo: NewNotificationRepository(db),
	}
}

// CreateNotification creates a new notification
func (s *NotificationService) CreateNotification(userID int, notificationType, content, targetURL string, actorID *int) (*models.Notification, error) {
	notification := &models.Notification{
		UserID:    userID,
		Type:      notificationType,
		Content:   content,
		TargetURL: targetURL,
		ActorID:   actorID,
		IsRead:    false,
	}
	
	if err := s.repo.Create(notification); err != nil {
		return nil, err
	}
	
	return notification, nil
}

// GetUserNotifications retrieves all notifications for a user
func (s *NotificationService) GetUserNotifications(userID int, limit int) ([]models.Notification, error) {
	return s.repo.GetByUserID(userID, limit)
}

// GetUnreadNotifications retrieves unread notifications for a user
func (s *NotificationService) GetUnreadNotifications(userID int) ([]models.Notification, error) {
	return s.repo.GetUnreadByUserID(userID)
}

// GetUnreadCount gets the count of unread notifications for a user
func (s *NotificationService) GetUnreadCount(userID int) (int64, error) {
	return s.repo.CountUnreadByUserID(userID)
}

// MarkAsRead marks a notification as read
func (s *NotificationService) MarkAsRead(notificationID int, userID int) error {
	return s.repo.MarkAsRead(notificationID, userID)
}

// MarkAllAsRead marks all notifications as read for a user
func (s *NotificationService) MarkAllAsRead(userID int) error {
	return s.repo.MarkAllAsRead(userID)
}

// DeleteNotification deletes a notification
func (s *NotificationService) DeleteNotification(notificationID int, userID int) error {
	return s.repo.Delete(notificationID, userID)
}
