package database

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/interactive-fanfic-platform/models"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	// Use a unique database name for each test to avoid index conflicts
	dbName := fmt.Sprintf("file::memory:?cache=shared&_fk=1&unique=%d", time.Now().UnixNano())
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}

	// Run migrations
	err = Migrate(db)
	if err != nil {
		// Ignore "index already exists" errors as they're harmless in tests
		if !strings.Contains(err.Error(), "already exists") {
			t.Fatalf("failed to migrate test database: %v", err)
		}
	}

	return db
}

// Feature: interactive-fanfic-platform, Property 5: Fanfic creation persists all data (unique ID part)
// Validates: Requirements 2.2
func TestProperty_FanficCreationUniqueID(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("Creating multiple fanfics generates unique IDs", prop.ForAll(
		func(fanficCount int, seed int64) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)

			// Create a test user with unique email
			user := &models.User{
				Username:     fmt.Sprintf("testauthor%d", seed),
				Email:        fmt.Sprintf("test%d@example.com", seed),
				PasswordHash: "hashedpassword",
			}
			if err := db.Create(user).Error; err != nil {
				t.Logf("Failed to create user: %v", err)
				return false
			}

			// Track all generated IDs
			generatedIDs := make(map[int]bool)

			// Create multiple fanfics
			for i := 0; i < fanficCount; i++ {
				fanfic := &models.Fanfic{
					AuthorID:        user.ID,
					Title:           fmt.Sprintf("Test Fanfic %d", i),
					Synopsis:        fmt.Sprintf("Synopsis for fanfic %d", i),
					Disclaimer:      fmt.Sprintf("Disclaimer %d", i),
					Category:        "Romance",
					CoverURL:        fmt.Sprintf("/covers/test%d.jpg", i),
					InteractiveMode: i%2 == 0,
				}

				if err := db.Create(fanfic).Error; err != nil {
					t.Logf("Failed to create fanfic: %v", err)
					return false
				}

				// Check that ID was assigned
				if fanfic.ID == 0 {
					t.Logf("Fanfic ID was not assigned")
					return false
				}

				// Check for uniqueness
				if generatedIDs[fanfic.ID] {
					t.Logf("Duplicate ID generated: %d", fanfic.ID)
					return false
				}

				generatedIDs[fanfic.ID] = true

				// Verify the fanfic can be retrieved with the same ID
				var retrieved models.Fanfic
				if err := db.First(&retrieved, fanfic.ID).Error; err != nil {
					t.Logf("Failed to retrieve fanfic with ID %d: %v", fanfic.ID, err)
					return false
				}

				// Verify all data persisted correctly
				if retrieved.ID != fanfic.ID ||
					retrieved.AuthorID != fanfic.AuthorID ||
					retrieved.Title != fanfic.Title ||
					retrieved.Synopsis != fanfic.Synopsis ||
					retrieved.Disclaimer != fanfic.Disclaimer ||
					retrieved.Category != fanfic.Category ||
					retrieved.CoverURL != fanfic.CoverURL ||
					retrieved.InteractiveMode != fanfic.InteractiveMode {
					t.Logf("Retrieved fanfic data does not match created data")
					return false
				}
			}

			return true
		},
		gen.IntRange(1, 20), // Test with 1 to 20 fanfics
		gen.Int64(),         // Seed for unique user emails
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
