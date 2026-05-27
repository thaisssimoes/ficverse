package models

import "time"

// UserFollow registra que um usuário segue outro.
type UserFollow struct {
	FollowerID  int       `gorm:"primaryKey;autoIncrement:false" json:"follower_id"`
	FollowingID int       `gorm:"primaryKey;autoIncrement:false" json:"following_id"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}
