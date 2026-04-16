package models

import "time"

type Chapter struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	FanficID    int       `gorm:"not null;index" json:"fanfic_id"`
	Title       string    `gorm:"size:500;not null" json:"title"`
	Content     string    `gorm:"type:text;not null" json:"content"`
	CoverURL    string    `gorm:"size:512" json:"cover_url"`
	Order       int       `gorm:"not null;index" json:"order"`
	IsDraft     bool       `gorm:"not null" json:"is_draft"`
	ScheduledAt *time.Time `gorm:"index" json:"scheduled_at,omitempty"`
	ViewsCount  int        `gorm:"default:0" json:"views_count"`
	LikesCount  int       `gorm:"default:0" json:"likes_count"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Campos calculados — não persistidos no banco
	LikedByMe bool `gorm:"-" json:"liked_by_me"`

	Fanfic Fanfic `gorm:"foreignKey:FanficID" json:"fanfic,omitempty"`
}

// ChapterLike registra que um usuário curtiu um capítulo.
type ChapterLike struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int       `gorm:"not null;uniqueIndex:idx_chapter_like_user" json:"user_id"`
	ChapterID int       `gorm:"not null;uniqueIndex:idx_chapter_like_user" json:"chapter_id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
