package models

import "time"

type Answer struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      int       `gorm:"not null;index:idx_user_fanfic" json:"user_id"`
	FanficID    int       `gorm:"not null;index:idx_user_fanfic" json:"fanfic_id"`
	Placeholder string    `gorm:"size:255;not null" json:"placeholder"`
	AnswerText  string    `gorm:"type:text;not null" json:"answer_text"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Fanfic Fanfic `gorm:"foreignKey:FanficID" json:"fanfic,omitempty"`
}
