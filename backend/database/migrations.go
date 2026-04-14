package database

import (
	"fmt"
	"log"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

// RunSafeColumnMigrations adds new columns to existing tables if they are missing.
// This runs on every startup (even when AUTO_MIGRATE=false) and is safe to run multiple times.
func RunSafeColumnMigrations(db *gorm.DB) {
	migrateQuestionsColumns(db)
	migrateCommentsColumns(db)
	migrateCommentInteractionTables(db)
}

// migrateCommentsColumns garante que comments tenha parent_id e likes_count.
func migrateCommentsColumns(db *gorm.DB) {
	type col struct {
		name string
		ddl  string
	}
	cols := []col{
		{name: "parent_id", ddl: "ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE"},
		{name: "likes_count", ddl: "ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0"},
	}
	for _, c := range cols {
		if !db.Migrator().HasColumn(&models.Comment{}, c.name) {
			if err := db.Exec(c.ddl).Error; err != nil {
				log.Printf("Warning: could not add column '%s' to comments: %v", c.name, err)
			} else {
				log.Printf("Added column '%s' to comments table.", c.name)
			}
		}
	}
}

// migrateCommentInteractionTables creates comment_likes and comment_reports if they don't exist.
// Needed because AUTO_MIGRATE=false in production, so AutoMigrate never ran for these tables.
func migrateCommentInteractionTables(db *gorm.DB) {
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS comment_likes (
		id         SERIAL PRIMARY KEY,
		user_id    INTEGER NOT NULL,
		comment_id INTEGER NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		UNIQUE(user_id, comment_id)
	)`).Error; err != nil {
		log.Printf("Warning: could not create comment_likes table: %v", err)
	}
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS comment_reports (
		id         SERIAL PRIMARY KEY,
		user_id    INTEGER NOT NULL,
		comment_id INTEGER NOT NULL,
		reason     VARCHAR(100) NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		UNIQUE(user_id, comment_id)
	)`).Error; err != nil {
		log.Printf("Warning: could not create comment_reports table: %v", err)
	}
}

// migrateQuestionsColumns ensures the questions table has the interactive-mode columns.
func migrateQuestionsColumns(db *gorm.DB) {
	type col struct {
		name string
		ddl  string
	}
	cols := []col{
		{name: "variable_type", ddl: "ALTER TABLE questions ADD COLUMN IF NOT EXISTS variable_type VARCHAR(50) NOT NULL DEFAULT 'custom'"},
		{name: "standard_key", ddl: "ALTER TABLE questions ADD COLUMN IF NOT EXISTS standard_key VARCHAR(100)"},
		{name: "default_answer", ddl: "ALTER TABLE questions ADD COLUMN IF NOT EXISTS default_answer TEXT"},
	}
	for _, c := range cols {
		if !db.Migrator().HasColumn(&models.Question{}, c.name) {
			if err := db.Exec(c.ddl).Error; err != nil {
				log.Printf("Warning: could not add column '%s' to questions: %v", c.name, err)
			} else {
				log.Printf("Added column '%s' to questions table.", c.name)
			}
		}
	}
}

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
		&models.CommentLike{},
		&models.CommentReport{},
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
