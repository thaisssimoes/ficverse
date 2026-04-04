package models

import "time"

type FanficFavorite struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int       `gorm:"not null;uniqueIndex:idx_user_fanfic" json:"user_id"`
	FanficID  int       `gorm:"not null;uniqueIndex:idx_user_fanfic" json:"fanfic_id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Fanfic Fanfic `gorm:"foreignKey:FanficID" json:"fanfic,omitempty"`
}
