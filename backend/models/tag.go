package models

import "time"

type Tag struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"size:100;not null;uniqueIndex:idx_tag_name_type" json:"name"`
	Type      string    `gorm:"size:20;not null;uniqueIndex:idx_tag_name_type" json:"type"` // fandom, warning, pairing, subgenre
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	Fanfics []Fanfic `gorm:"many2many:fanfic_tags" json:"fanfics,omitempty"`
}
