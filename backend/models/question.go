package models

import "time"

type Question struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	FanficID     int       `gorm:"not null;index" json:"fanfic_id"`
	QuestionText string    `gorm:"type:text;not null" json:"question_text"`
	Placeholder  string    `gorm:"size:255;not null" json:"placeholder"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`

	Fanfic Fanfic `gorm:"foreignKey:FanficID" json:"fanfic,omitempty"`
}
