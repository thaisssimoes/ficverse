package models

import "time"

// ReadingProgress tracks user's reading progress for fanfics
type ReadingProgress struct {
	ID              int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID          int       `gorm:"not null;index:idx_user_fanfic" json:"user_id"`
	FanficID        int       `gorm:"not null;index:idx_user_fanfic" json:"fanfic_id"`
	LastChapterRead int       `gorm:"not null" json:"last_chapter_read"`
	LastReadAt      time.Time `gorm:"autoUpdateTime;index" json:"last_read_at"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Fanfic Fanfic `gorm:"foreignKey:FanficID" json:"fanfic,omitempty"`
}
