package models

import "time"

type User struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Username     string    `gorm:"size:255;not null;unique" json:"username"`
	Email        string    `gorm:"size:255;not null;unique" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Bio          string    `gorm:"size:500" json:"bio"`
	AvatarURL    string    `gorm:"size:512" json:"avatar_url"`
	BannerURL    string    `gorm:"size:512" json:"banner_url"`
	IsAdmin      bool      `gorm:"default:false;not null" json:"is_admin"`
	IsBanned     bool      `gorm:"default:false;not null" json:"is_banned"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// WallMessage — recado público no mural do perfil de um usuário
type WallMessage struct {
	ID         int       `gorm:"primaryKey;autoIncrement" json:"id"`
	ProfileID  int       `gorm:"not null;index" json:"profile_id"` // dono do mural
	AuthorID   int       `gorm:"not null" json:"author_id"`
	AuthorName string    `gorm:"-" json:"author"` // populated at query time
	Content    string    `gorm:"size:1000;not null" json:"content"`
	Pinned     bool      `gorm:"default:false" json:"pinned"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// UserBlock — lista de bloqueios entre usuários
type UserBlock struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	BlockerID int       `gorm:"not null;index:idx_block_pair,unique" json:"blocker_id"`
	BlockedID int       `gorm:"not null;index:idx_block_pair,unique" json:"blocked_id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
