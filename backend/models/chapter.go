package models

import "time"

type Chapter struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	FanficID  int       `gorm:"not null;index" json:"fanfic_id"`
	Title     string    `gorm:"size:500;not null" json:"title"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Order     int       `gorm:"not null;index" json:"order"`
	IsDraft   bool      `gorm:"not null" json:"is_draft"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	Fanfic Fanfic `gorm:"foreignKey:FanficID" json:"fanfic,omitempty"`
}
