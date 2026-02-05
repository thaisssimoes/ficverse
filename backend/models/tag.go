package models

import "time"

type Tag struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"size:100;not null;uniqueIndex" json:"name"`
	Type      string    `gorm:"size:20;not null;index" json:"type"` // fandom, warning, pairing
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	Fanfics []Fanfic `gorm:"many2many:fanfic_tags" json:"fanfics,omitempty"`
}
