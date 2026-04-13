package models

import "time"

// Standard variable keys available for all fanfics
const (
	StandardKeyFirstName     = "first_name"
	StandardKeyLastName      = "last_name"
	StandardKeyNickname      = "nickname"
	StandardKeyEyeColor      = "eye_color"
	StandardKeyHairColor     = "hair_color"
	StandardKeyFavoriteColor = "favorite_color"
	StandardKeyFavoriteFood  = "favorite_food"
	StandardKeyAge           = "age"
)

// StandardVariables is the ordered list of all standard variable definitions
var StandardVariables = []StandardVariable{
	{Key: StandardKeyFirstName, Label: "Primeiro Nome", Placeholder: "ex: Ana"},
	{Key: StandardKeyLastName, Label: "Sobrenome", Placeholder: "ex: Silva"},
	{Key: StandardKeyNickname, Label: "Apelido", Placeholder: "ex: Ani"},
	{Key: StandardKeyEyeColor, Label: "Cor dos Olhos", Placeholder: "ex: castanhos"},
	{Key: StandardKeyHairColor, Label: "Cor do Cabelo", Placeholder: "ex: preto"},
	{Key: StandardKeyFavoriteColor, Label: "Cor Favorita", Placeholder: "ex: roxo"},
	{Key: StandardKeyFavoriteFood, Label: "Comida Favorita", Placeholder: "ex: pizza"},
	{Key: StandardKeyAge, Label: "Idade", Placeholder: "ex: 22"},
}

type StandardVariable struct {
	Key         string `json:"key"`
	Label       string `json:"label"`
	Placeholder string `json:"placeholder"`
}

type Question struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	FanficID     int       `gorm:"not null;index" json:"fanfic_id"`
	QuestionText string    `gorm:"type:text;not null" json:"question_text"`
	Placeholder  string    `gorm:"size:255;not null" json:"placeholder"`
	// VariableType: "standard" or "custom"
	VariableType string `gorm:"size:50;not null;default:'custom'" json:"variable_type"`
	// StandardKey: key from StandardVariables (only set when VariableType == "standard")
	StandardKey string `gorm:"size:100" json:"standard_key,omitempty"`
	// DefaultAnswer: resposta padrão usada no modo normal de leitura
	DefaultAnswer string    `gorm:"type:text" json:"default_answer,omitempty"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`

	Fanfic Fanfic `gorm:"foreignKey:FanficID" json:"fanfic,omitempty"`
}
