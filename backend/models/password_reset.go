package models

import "time"

type PasswordResetToken struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int       `gorm:"not null;index" json:"user_id"`
	TokenHash string    `gorm:"size:255;not null" json:"-"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	Used      bool      `gorm:"default:false" json:"used"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
