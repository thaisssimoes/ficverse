package models

// Predefined categories for fanfics
var Categories = []string{
	"Romance",
	"Aventura",
	"Drama",
	"Comédia",
	"Ficção Científica",
	"Fantasia",
	"Terror",
	"Mistério",
}

// IsValidCategory checks if a category is valid
func IsValidCategory(category string) bool {
	for _, c := range Categories {
		if c == category {
			return true
		}
	}
	return false
}
