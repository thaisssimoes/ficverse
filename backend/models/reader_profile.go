package models

import "time"

// ReaderProfile stores named character profiles for a reader.
// A user can have multiple profiles (e.g. "Perfil Principal", "Aventura").
type ReaderProfile struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        int       `gorm:"not null;index" json:"user_id"`
	Name          string    `gorm:"size:255;not null;default:'Perfil Principal'" json:"name"`
	FirstName     string    `gorm:"size:255" json:"primeiro_nome"`
	LastName      string    `gorm:"size:255" json:"sobrenome"`
	Nickname      string    `gorm:"size:255" json:"apelido"`
	EyeColor      string    `gorm:"size:255" json:"cor_olhos"`
	HairColor     string    `gorm:"size:255" json:"cor_cabelo"`
	FavoriteColor string    `gorm:"size:255" json:"cor_favorita"`
	FavoriteFood  string    `gorm:"size:255" json:"comida_favorita"`
	Age           string    `gorm:"size:50"  json:"idade"`
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
		StandardKeyAge:           p.Age,
	}
}
