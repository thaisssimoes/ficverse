package models

import "time"

// Notification represents a user notification
type Notification struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	UserID    int       `json:"user_id" gorm:"not null;index"`
	Type      string    `json:"type" gorm:"not null"` // comment, like, follow, system
	Content   string    `json:"content" gorm:"not null"`
	ActorID   *int      `json:"actor_id" gorm:"index"` // User who triggered the notification
	Actor     *User     `json:"actor,omitempty" gorm:"foreignKey:ActorID"`
	TargetURL string    `json:"target_url"`
	IsRead    bool      `json:"is_read" gorm:"default:false;index"`
	CreatedAt time.Time `json:"created_at"`
}
