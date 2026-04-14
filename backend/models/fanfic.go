package models

import "time"

type Fanfic struct {
	ID              int        `gorm:"primaryKey;autoIncrement" json:"id"`
	AuthorID        int        `gorm:"not null;index" json:"author_id"`
	Title           string     `gorm:"size:500;not null" json:"title"`
	Synopsis        string     `gorm:"type:text;not null" json:"synopsis"`
	Disclaimer      string     `gorm:"type:text" json:"disclaimer"`
	Category        string     `gorm:"size:100;not null;index" json:"category"`
	CoverURL        string     `gorm:"size:500" json:"cover_url"`
	InteractiveMode bool       `gorm:"default:false" json:"interactive_mode"`
	IsDraft         bool       `gorm:"index" json:"is_draft"`
	IsAdultContent  bool       `gorm:"default:false" json:"is_adult_content"`
	TriggerWarnings string     `gorm:"type:text" json:"trigger_warnings"`
	IsComplete      bool       `gorm:"default:false" json:"is_complete"`
	ActivityTag     string     `gorm:"size:50" json:"activity_tag"`
	PublishedAt     *time.Time `gorm:"index" json:"published_at"`
	CreatedAt       time.Time  `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt       time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	Author   User      `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Chapters []Chapter `gorm:"foreignKey:FanficID" json:"chapters,omitempty"`
	Tags     []Tag     `gorm:"many2many:fanfic_tags" json:"tags,omitempty"`
}
