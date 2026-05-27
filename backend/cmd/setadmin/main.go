package main

import (
	"fmt"
	"log"
	"os"

	"github.com/interactive-fanfic-platform/config"
	"github.com/interactive-fanfic-platform/database"
)

func main() {
	email := "thay.ssim@gmail.com"
	if len(os.Args) > 1 {
		email = os.Args[1]
	}

	cfg := config.Load()
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("DB error: %v", err)
	}

	// Garantir que a coluna existe
	db.Exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false`)

	result := db.Exec("UPDATE users SET is_admin = true WHERE email = ?", email)
	if result.Error != nil {
		log.Fatalf("Update error: %v", result.Error)
	}

	var info struct {
		ID       int
		Username string
		Email    string
		IsAdmin  bool `gorm:"column:is_admin"`
	}
	db.Raw("SELECT id, username, email, is_admin FROM users WHERE email = ?", email).Scan(&info)
	fmt.Printf("✓ Admin definido\n  ID: %d | Username: %s | Email: %s | IsAdmin: %v\n",
		info.ID, info.Username, info.Email, info.IsAdmin)
}
