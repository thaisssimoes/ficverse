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
		&models.PasswordResetToken{},
		&models.FanficFavorite{},
		&models.ReaderProfile{},
		&models.WallMessage{},
		&models.UserBlock{},
	)
	if err != nil {
		return fmt.Errorf("failed to run auto-migration: %w", err)
	}

	// Remove o unique index antigo em reader_profiles.user_id para permitir múltiplos perfis.
	// GORM AutoMigrate não remove constraints — fazemos manualmente.
	migrateReaderProfiles(db)

	log.Println("Migrations completed successfully!")
	return nil
}

func migrateReaderProfiles(db *gorm.DB) {
	// Adiciona coluna 'name' se ainda não existir
	if !db.Migrator().HasColumn(&models.ReaderProfile{}, "name") {
		if err := db.Migrator().AddColumn(&models.ReaderProfile{}, "name"); err != nil {
			log.Printf("Warning: could not add 'name' column to reader_profiles: %v", err)
		} else {
			// Preenche perfis existentes com nome padrão
			db.Exec("UPDATE reader_profiles SET name = 'Perfil Principal' WHERE name IS NULL OR name = ''")
		}
	}

	// Remove o unique index em user_id (criado pelo uniqueIndex antigo do GORM)
	// Tenta os dois nomes possíveis que o GORM pode ter gerado
	for _, idxName := range []string{
		"uni_reader_profiles_user_id",
		"idx_reader_profiles_user_id",
	} {
		db.Exec(fmt.Sprintf("DROP INDEX IF EXISTS %s", idxName))
	}
	// PostgreSQL usa constraints nomeadas
	db.Exec("ALTER TABLE reader_profiles DROP CONSTRAINT IF EXISTS uni_reader_profiles_user_id")
}
