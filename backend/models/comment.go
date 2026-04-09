package models

import "time"

type Comment struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int       `gorm:"not null;index" json:"user_id"`
	FanficID  int       `gorm:"not null;index" json:"fanfic_id"`
	ChapterID *int      `gorm:"index" json:"chapter_id,omitempty"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Edited    bool      `gorm:"default:false" json:"edited"`
	CreatedAt time.Time `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User    User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Fanfic  Fanfic   `gorm:"foreignKey:FanficID" json:"fanfic,omitempty"`
	Chapter *Chapter `gorm:"foreignKey:ChapterID" json:"chapter,omitempty"`
}
