package models

import "time"

type PendingQuestion struct {
	ID         int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     int       `gorm:"not null;index:idx_user_fanfic_question" json:"user_id"`
	FanficID   int       `gorm:"not null;index:idx_user_fanfic_question" json:"fanfic_id"`
	QuestionID int       `gorm:"not null;index:idx_user_fanfic_question" json:"question_id"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`

	User     User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Fanfic   Fanfic   `gorm:"foreignKey:FanficID" json:"fanfic,omitempty"`
	Question Question `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}
