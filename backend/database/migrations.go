package database

import (
	"fmt"
	"log"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

// Migrate runs all database migrations using GORM AutoMigrate
func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	err := db.AutoMigrate(
		&models.User{},
		&models.Fanfic{},
		&models.Chapter{},
		&models.Tag{},
		&models.Question{},
		&models.Answer{},
		&models.Comment{},
		&models.PendingQuestion{},
		&models.Notification{},
		&models.ReadingProgress{},
	)
	if err != nil {
		return fmt.Errorf("failed to run auto-migration: %w", err)
	}

	log.Println("Migrations completed successfully!")
	return nil
}
