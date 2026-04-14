package models

import "time"

type Comment struct {
	ID         int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     int       `gorm:"not null;index" json:"user_id"`
	FanficID   int       `gorm:"not null;index" json:"fanfic_id"`
	ChapterID  *int      `gorm:"index" json:"chapter_id,omitempty"`
	ParentID   *int      `gorm:"index" json:"parent_id,omitempty"`
	Content    string    `gorm:"type:text;not null" json:"content"`
	Edited     bool      `gorm:"default:false" json:"edited"`
	LikesCount int       `gorm:"default:0" json:"likes_count"`
	CreatedAt  time.Time `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Computed — não armazenado, populado pelo handler quando há usuário autenticado
	LikedByMe bool `gorm:"-" json:"liked_by_me"`

	User    User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Fanfic  Fanfic   `gorm:"foreignKey:FanficID" json:"-"`
	Chapter *Chapter `gorm:"foreignKey:ChapterID" json:"-"`
}

type CommentLike struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int       `gorm:"not null;uniqueIndex:idx_comment_like_user" json:"user_id"`
	CommentID int       `gorm:"not null;uniqueIndex:idx_comment_like_user" json:"comment_id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type CommentReport struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int       `gorm:"not null;uniqueIndex:idx_comment_report_user" json:"user_id"`
	CommentID int       `gorm:"not null;uniqueIndex:idx_comment_report_user" json:"comment_id"`
	Reason    string    `gorm:"type:varchar(100);not null" json:"reason"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
