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
	migrateChapterStatsColumns(db)
	migrateChapterLikesTable(db)
	migrateFanficExtraColumns(db)
	migrateTagUniqueIndex(db)
	migrateHiatusColumns(db)
	migrateScheduledChapters(db)
	migrateUserFollowsTable(db)
	migrateAdminColumns(db)
}

// migrateAdminColumns adiciona is_admin e is_banned à tabela users.
func migrateAdminColumns(db *gorm.DB) {
	db.Exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin  BOOLEAN NOT NULL DEFAULT false`)
	db.Exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false`)
	log.Println("Admin columns ensured on users table.")
}

// migrateUserFollowsTable cria a tabela user_follows se não existir.
func migrateUserFollowsTable(db *gorm.DB) {
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS user_follows (
		follower_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		created_at   TIMESTAMPTZ DEFAULT NOW(),
		PRIMARY KEY (follower_id, following_id)
	)`).Error; err != nil {
		log.Printf("Warning: could not create user_follows table: %v", err)
	}
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

// migrateChapterStatsColumns garante que chapters tenha views_count e likes_count.
func migrateChapterStatsColumns(db *gorm.DB) {
	type col struct {
		name string
		ddl  string
	}
	cols := []col{
		{name: "views_count", ddl: "ALTER TABLE chapters ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0"},
		{name: "likes_count", ddl: "ALTER TABLE chapters ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0"},
	}
	for _, c := range cols {
		if !db.Migrator().HasColumn(&models.Chapter{}, c.name) {
			if err := db.Exec(c.ddl).Error; err != nil {
				log.Printf("Warning: could not add column '%s' to chapters: %v", c.name, err)
			} else {
				log.Printf("Added column '%s' to chapters table.", c.name)
			}
		}
	}
}

// migrateChapterLikesTable cria a tabela chapter_likes se não existir.
func migrateChapterLikesTable(db *gorm.DB) {
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS chapter_likes (
		id         SERIAL PRIMARY KEY,
		user_id    INTEGER NOT NULL,
		chapter_id INTEGER NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		UNIQUE(user_id, chapter_id)
	)`).Error; err != nil {
		log.Printf("Warning: could not create chapter_likes table: %v", err)
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

// migrateFanficExtraColumns garante que fanfics tenha is_complete e activity_tag.
func migrateFanficExtraColumns(db *gorm.DB) {
	type col struct {
		name string
		ddl  string
	}
	cols := []col{
		{name: "is_complete", ddl: "ALTER TABLE fanfics ADD COLUMN IF NOT EXISTS is_complete BOOLEAN NOT NULL DEFAULT false"},
		{name: "activity_tag", ddl: "ALTER TABLE fanfics ADD COLUMN IF NOT EXISTS activity_tag VARCHAR(50) NOT NULL DEFAULT ''"},
	}
	for _, c := range cols {
		if !db.Migrator().HasColumn(&models.Fanfic{}, c.name) {
			if err := db.Exec(c.ddl).Error; err != nil {
				log.Printf("Warning: could not add column '%s' to fanfics: %v", c.name, err)
			} else {
				log.Printf("Added column '%s' to fanfics table.", c.name)
			}
		}
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

// migrateTagUniqueIndex drops the old global unique index on tags.name and replaces
// it with a composite unique index on (name, type), allowing the same tag name in different types.
func migrateTagUniqueIndex(db *gorm.DB) {
	// Drop old single-column unique index (GORM may have generated either name)
	for _, idx := range []string{"idx_tags_name", "uni_tags_name"} {
		db.Exec(fmt.Sprintf("DROP INDEX IF EXISTS %s", idx))
	}
	// Create composite unique index if it doesn't exist yet
	if err := db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_name_type ON tags(name, type)`).Error; err != nil {
		log.Printf("Warning: could not create composite tag unique index: %v", err)
	}
}

func migrateHiatusColumns(db *gorm.DB) {
	db.Exec(`ALTER TABLE fanfics ADD COLUMN IF NOT EXISTS is_hiatus BOOLEAN NOT NULL DEFAULT false`)
	db.Exec(`ALTER TABLE fanfics ADD COLUMN IF NOT EXISTS hiatus_until TIMESTAMPTZ`)
}

func migrateScheduledChapters(db *gorm.DB) {
	db.Exec(`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`)
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
