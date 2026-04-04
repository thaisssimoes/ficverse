package models

import "time"

// ReaderProfile stores the standard variables pre-filled by the reader.
// One record per user (upsert on update).
type ReaderProfile struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        int       `gorm:"not null;uniqueIndex" json:"user_id"`
	FirstName     string    `gorm:"size:255" json:"first_name"`
	LastName      string    `gorm:"size:255" json:"last_name"`
	Nickname      string    `gorm:"size:255" json:"nickname"`
	EyeColor      string    `gorm:"size:255" json:"eye_color"`
	HairColor     string    `gorm:"size:255" json:"hair_color"`
	FavoriteColor string    `gorm:"size:255" json:"favorite_color"`
	FavoriteFood  string    `gorm:"size:255" json:"favorite_food"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// ToMap converts the profile fields to a placeholder->value map
// using the same standard keys defined in question.go.
func (p *ReaderProfile) ToMap() map[string]string {
	return map[string]string{
		StandardKeyFirstName:     p.FirstName,
		StandardKeyLastName:      p.LastName,
		StandardKeyNickname:      p.Nickname,
		StandardKeyEyeColor:      p.EyeColor,
		StandardKeyHairColor:     p.HairColor,
		StandardKeyFavoriteColor: p.FavoriteColor,
		StandardKeyFavoriteFood:  p.FavoriteFood,
	}
}
