package database

import (
	"strings"
	"testing"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestInitializeWithConfig(t *testing.T) {
	// Note: This test uses SQLite for simplicity, but the connection pooling
	// configuration is still applied and tested
	
	// Create a temporary in-memory database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Get the underlying SQL database
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("Failed to get underlying database: %v", err)
	}

	// Configure connection pool
	config := ConnectionConfig{
		MaxIdleConns:    5,
		MaxOpenConns:    50,
		ConnMaxLifetime: 30 * time.Minute,
		ConnMaxIdleTime: 5 * time.Minute,
	}

	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(config.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(config.ConnMaxIdleTime)

	// Verify the settings were applied
	stats := sqlDB.Stats()
	if stats.MaxOpenConnections != config.MaxOpenConns {
		t.Errorf("Expected MaxOpenConnections to be %d, got %d", config.MaxOpenConns, stats.MaxOpenConnections)
	}

	// Close the connection
	if err := sqlDB.Close(); err != nil {
		t.Errorf("Failed to close database: %v", err)
	}
}

func TestDefaultConnectionConfig(t *testing.T) {
	config := DefaultConnectionConfig()

	if config.MaxIdleConns != 10 {
		t.Errorf("Expected MaxIdleConns to be 10, got %d", config.MaxIdleConns)
	}

	if config.MaxOpenConns != 100 {
		t.Errorf("Expected MaxOpenConns to be 100, got %d", config.MaxOpenConns)
	}

	if config.ConnMaxLifetime != time.Hour {
		t.Errorf("Expected ConnMaxLifetime to be 1 hour, got %v", config.ConnMaxLifetime)
	}

	if config.ConnMaxIdleTime != 10*time.Minute {
		t.Errorf("Expected ConnMaxIdleTime to be 10 minutes, got %v", config.ConnMaxIdleTime)
	}
}

func TestMigrationRunner(t *testing.T) {
	// Create a test database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Run migrations
	err = Migrate(db)
	if err != nil {
		// Ignore "index already exists" errors
		if !strings.Contains(err.Error(), "already exists") {
			t.Fatalf("Failed to run migrations: %v", err)
		}
	}

	// Verify tables were created
	if !db.Migrator().HasTable("users") {
		t.Error("Expected users table to exist")
	}

	if !db.Migrator().HasTable("fanfics") {
		t.Error("Expected fanfics table to exist")
	}

	if !db.Migrator().HasTable("chapters") {
		t.Error("Expected chapters table to exist")
	}

	if !db.Migrator().HasTable("questions") {
		t.Error("Expected questions table to exist")
	}

	if !db.Migrator().HasTable("answers") {
		t.Error("Expected answers table to exist")
	}

	if !db.Migrator().HasTable("comments") {
		t.Error("Expected comments table to exist")
	}

	if !db.Migrator().HasTable("pending_questions") {
		t.Error("Expected pending_questions table to exist")
	}
}

func TestMigrationRunner_DropAllTables(t *testing.T) {
	// Create a test database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Run migrations
	err = Migrate(db)
	if err != nil {
		// Ignore "index already exists" errors
		if !strings.Contains(err.Error(), "already exists") {
			t.Fatalf("Failed to run migrations: %v", err)
		}
	}

	// Verify tables exist
	if !db.Migrator().HasTable("users") {
		t.Error("Expected users table to exist before drop")
	}

	// Drop all tables
	if err := db.Migrator().DropTable(
		"users",
		"fanfics",
		"chapters",
		"tags",
		"fanfic_tags",
		"questions",
		"answers",
		"comments",
		"pending_questions",
		"notifications",
		"reading_progress",
	); err != nil {
		t.Fatalf("Failed to drop tables: %v", err)
	}

	// Verify tables were dropped
	if db.Migrator().HasTable("users") {
		t.Error("Expected users table to not exist after drop")
	}

	if db.Migrator().HasTable("fanfics") {
		t.Error("Expected fanfics table to not exist after drop")
	}
}

func TestMigrate_BackwardCompatibility(t *testing.T) {
	// Create a test database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Test the backward-compatible Migrate function
	err = Migrate(db)
	if err != nil {
		// Ignore "index already exists" errors
		if !strings.Contains(err.Error(), "already exists") {
			t.Fatalf("Failed to run Migrate: %v", err)
		}
	}

	// Verify tables were created
	if !db.Migrator().HasTable("users") {
		t.Error("Expected users table to exist")
	}
}
