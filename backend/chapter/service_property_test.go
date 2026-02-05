package chapter

import (
	"strings"
	"testing"

	"github.com/interactive-fanfic-platform/models"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Auto-migrate all models
	if err := db.AutoMigrate(&models.User{}, &models.Fanfic{}, &models.Chapter{}); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

// createTestFanfic creates a test fanfic in the database
func createTestFanfic(t *testing.T, db *gorm.DB) int {
	// Create test author first
	user := &models.User{
		Username:     "testauthor",
		Email:        "test@example.com",
		PasswordHash: "hashedpassword",
	}
	if err := db.Create(user).Error; err != nil {
		t.Fatalf("Failed to create test author: %v", err)
	}

	// Create test fanfic
	fanfic := &models.Fanfic{
		AuthorID:        user.ID,
		Title:           "Test Fanfic",
		Synopsis:        "A test fanfic for chapter testing",
		Category:        "Test",
		InteractiveMode: false,
	}
	if err := db.Create(fanfic).Error; err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}

	return fanfic.ID
}

// Generators for valid chapter data

func genValidChapterTitle() gopter.Gen {
	return gen.RegexMatch("Chapter [0-9]{1,3}: [A-Z][a-zA-Z0-9 ]{5,50}")
}

func genValidChapterContent() gopter.Gen {
	return gen.RegexMatch("[A-Z][a-zA-Z0-9 .,!?\\n]{50,500}")
}

// Feature: interactive-fanfic-platform, Property 8: Chapter ordering is maintained
func TestProperty_ChapterOrderingIsMaintained(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("chapters are always displayed in sequential order", prop.ForAll(
		func(chapterCount int) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			fanficID := createTestFanfic(t, db)
			chapterService := NewChapterService(db)

			// Create multiple chapters
			createdChapters := make([]*models.Chapter, 0, chapterCount)
			for i := 0; i < chapterCount; i++ {
				titleVal, _ := genValidChapterTitle().Sample()
				title := titleVal.(string)
				contentVal, _ := genValidChapterContent().Sample()
				content := contentVal.(string)
				
				chapter, err := chapterService.CreateChapter(fanficID, title, content, false)
				if err != nil {
					t.Logf("Failed to create chapter: %v", err)
					return false
				}
				createdChapters = append(createdChapters, chapter)
			}

			// Get the author ID for authorization
			var fanfic models.Fanfic
			db.First(&fanfic, fanficID)

			// Retrieve chapters
			chapters, err := chapterService.ListChapters(fanficID, fanfic.AuthorID)
			if err != nil {
				t.Logf("Failed to list chapters: %v", err)
				return false
			}

			// Verify count matches
			if len(chapters) != chapterCount {
				t.Logf("Chapter count mismatch: expected %d, got %d", chapterCount, len(chapters))
				return false
			}

			// Verify sequential ordering (1, 2, 3, ...)
			for i, chapter := range chapters {
				expectedOrder := i + 1
				if chapter.Order != expectedOrder {
					t.Logf("Chapter order mismatch at index %d: expected %d, got %d", i, expectedOrder, chapter.Order)
					return false
				}
			}

			// Verify no gaps in ordering
			for i := 0; i < len(chapters)-1; i++ {
				if chapters[i+1].Order != chapters[i].Order+1 {
					t.Logf("Gap in chapter ordering between index %d and %d", i, i+1)
					return false
				}
			}

			// Verify chapters are ordered by Order field
			for i := 0; i < len(chapters)-1; i++ {
				if chapters[i].Order >= chapters[i+1].Order {
					t.Logf("Chapters not properly ordered: chapter %d has order %d, chapter %d has order %d",
						i, chapters[i].Order, i+1, chapters[i+1].Order)
					return false
				}
			}

			return true
		},
		gen.IntRange(1, 10), // Test with 1 to 10 chapters
	))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 9: Chapter updates preserve identity
func TestProperty_ChapterUpdatesPreserveIdentity(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("updating chapter preserves ID and order", prop.ForAll(
		func(originalTitle, originalContent, newTitle, newContent string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			fanficID := createTestFanfic(t, db)
			chapterService := NewChapterService(db)

			// Create initial chapter
			chapter, err := chapterService.CreateChapter(fanficID, originalTitle, originalContent, false)
			if err != nil {
				t.Logf("Failed to create chapter: %v", err)
				return false
			}

			// Store original ID and order
			originalID := chapter.ID
			originalOrder := chapter.Order

			// Update chapter
			updatedChapter, err := chapterService.UpdateChapter(chapter.ID, newTitle, newContent, nil)
			if err != nil {
				t.Logf("Failed to update chapter: %v", err)
				return false
			}

			// Verify ID is preserved
			if updatedChapter.ID != originalID {
				t.Logf("Chapter ID changed after update: expected %d, got %d", originalID, updatedChapter.ID)
				return false
			}

			// Verify order is preserved
			if updatedChapter.Order != originalOrder {
				t.Logf("Chapter order changed after update: expected %d, got %d", originalOrder, updatedChapter.Order)
				return false
			}

			// Verify title was updated (trimmed)
			expectedTitle := strings.TrimSpace(newTitle)
			if updatedChapter.Title != expectedTitle {
				t.Logf("Chapter title not updated: expected '%s', got '%s'", expectedTitle, updatedChapter.Title)
				return false
			}

			// Verify content was updated (trimmed)
			expectedContent := strings.TrimSpace(newContent)
			if updatedChapter.Content != expectedContent {
				t.Logf("Chapter content not updated: expected '%s', got '%s'", expectedContent, updatedChapter.Content)
				return false
			}

			// Get the author ID for authorization
			var fanfic models.Fanfic
			db.First(&fanfic, fanficID)

			// Retrieve chapter from database to verify persistence
			retrievedChapter, err := chapterService.GetChapter(originalID, fanfic.AuthorID)
			if err != nil {
				t.Logf("Failed to retrieve chapter: %v", err)
				return false
			}

			// Verify retrieved chapter matches updated chapter
			if retrievedChapter.ID != originalID ||
				retrievedChapter.Order != originalOrder ||
				retrievedChapter.Title != expectedTitle ||
				retrievedChapter.Content != expectedContent {
				t.Logf("Retrieved chapter does not match updated chapter")
				return false
			}

			return true
		},
		genValidChapterTitle(),
		genValidChapterContent(),
		genValidChapterTitle(),
		genValidChapterContent(),
	))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 10: Chapter deletion adjusts ordering
func TestProperty_ChapterDeletionAdjustsOrdering(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("deleting chapter adjusts remaining chapter orders", prop.ForAll(
		func(chapterCount int, deleteIndex int) bool {
			// Ensure we have at least 2 chapters and valid delete index
			if chapterCount < 2 {
				return true // Skip test cases with less than 2 chapters
			}
			if deleteIndex < 0 || deleteIndex >= chapterCount {
				return true // Skip invalid delete indices
			}

			// Setup fresh database for each test
			db := setupTestDB(t)
			fanficID := createTestFanfic(t, db)
			chapterService := NewChapterService(db)

			// Create multiple chapters
			createdChapters := make([]*models.Chapter, 0, chapterCount)
			for i := 0; i < chapterCount; i++ {
				titleVal, _ := genValidChapterTitle().Sample()
				title := titleVal.(string)
				contentVal, _ := genValidChapterContent().Sample()
				content := contentVal.(string)
				
				chapter, err := chapterService.CreateChapter(fanficID, title, content, false)
				if err != nil {
					t.Logf("Failed to create chapter: %v", err)
					return false
				}
				createdChapters = append(createdChapters, chapter)
			}

			// Delete chapter at specified index
			chapterToDelete := createdChapters[deleteIndex]
			err := chapterService.DeleteChapter(chapterToDelete.ID)
			if err != nil {
				t.Logf("Failed to delete chapter: %v", err)
				return false
			}

			// Get the author ID for authorization
			var fanfic models.Fanfic
			db.First(&fanfic, fanficID)

			// Retrieve remaining chapters
			remainingChapters, err := chapterService.ListChapters(fanficID, fanfic.AuthorID)
			if err != nil {
				t.Logf("Failed to list chapters: %v", err)
				return false
			}

			// Verify count is N-1
			expectedCount := chapterCount - 1
			if len(remainingChapters) != expectedCount {
				t.Logf("Chapter count mismatch after deletion: expected %d, got %d", expectedCount, len(remainingChapters))
				return false
			}

			// Verify sequential ordering from 1 to N-1
			for i, chapter := range remainingChapters {
				expectedOrder := i + 1
				if chapter.Order != expectedOrder {
					t.Logf("Chapter order mismatch at index %d: expected %d, got %d", i, expectedOrder, chapter.Order)
					return false
				}
			}

			// Verify no gaps in ordering
			for i := 0; i < len(remainingChapters)-1; i++ {
				if remainingChapters[i+1].Order != remainingChapters[i].Order+1 {
					t.Logf("Gap in chapter ordering between index %d and %d", i, i+1)
					return false
				}
			}

			// Verify deleted chapter is not in the list
			for _, chapter := range remainingChapters {
				if chapter.ID == chapterToDelete.ID {
					t.Logf("Deleted chapter still appears in chapter list")
					return false
				}
			}

			return true
		},
		gen.IntRange(2, 10), // Test with 2 to 10 chapters
		gen.IntRange(0, 9),  // Delete index (will be validated in test)
	))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 11: Chapter reordering updates sequence
func TestProperty_ChapterReorderingUpdatesSequence(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("reordering chapters updates their sequence", prop.ForAll(
		func(chapterCount int, seed int64) bool {
			// Ensure we have at least 2 chapters
			if chapterCount < 2 {
				return true // Skip test cases with less than 2 chapters
			}

			// Setup fresh database for each test
			db := setupTestDB(t)
			fanficID := createTestFanfic(t, db)
			chapterService := NewChapterService(db)

			// Create multiple chapters
			createdChapters := make([]*models.Chapter, 0, chapterCount)
			for i := 0; i < chapterCount; i++ {
				titleVal, _ := genValidChapterTitle().Sample()
				title := titleVal.(string)
				contentVal, _ := genValidChapterContent().Sample()
				content := contentVal.(string)
				
				chapter, err := chapterService.CreateChapter(fanficID, title, content, false)
				if err != nil {
					t.Logf("Failed to create chapter: %v", err)
					return false
				}
				createdChapters = append(createdChapters, chapter)
			}

			// Create a permutation of chapter IDs (shuffle them)
			chapterIDs := make([]int, len(createdChapters))
			for i, ch := range createdChapters {
				chapterIDs[i] = ch.ID
			}

			// Shuffle the IDs using the seed for reproducibility
			shuffleSlice(chapterIDs, seed)

			// Reorder chapters
			err := chapterService.ReorderChapters(fanficID, chapterIDs)
			if err != nil {
				t.Logf("Failed to reorder chapters: %v", err)
				return false
			}

			// Get the author ID for authorization
			var fanfic models.Fanfic
			db.First(&fanfic, fanficID)

			// Retrieve chapters after reordering
			reorderedChapters, err := chapterService.ListChapters(fanficID, fanfic.AuthorID)
			if err != nil {
				t.Logf("Failed to list chapters: %v", err)
				return false
			}

			// Verify count is unchanged
			if len(reorderedChapters) != chapterCount {
				t.Logf("Chapter count changed after reordering: expected %d, got %d", chapterCount, len(reorderedChapters))
				return false
			}

			// Verify chapters are in the new order
			for i, expectedID := range chapterIDs {
				if reorderedChapters[i].ID != expectedID {
					t.Logf("Chapter at position %d has wrong ID: expected %d, got %d", i, expectedID, reorderedChapters[i].ID)
					return false
				}

				// Verify order field matches position
				expectedOrder := i + 1
				if reorderedChapters[i].Order != expectedOrder {
					t.Logf("Chapter at position %d has wrong order: expected %d, got %d", i, expectedOrder, reorderedChapters[i].Order)
					return false
				}
			}

			// Verify sequential ordering (1, 2, 3, ...)
			for i, chapter := range reorderedChapters {
				expectedOrder := i + 1
				if chapter.Order != expectedOrder {
					t.Logf("Chapter order mismatch at index %d: expected %d, got %d", i, expectedOrder, chapter.Order)
					return false
				}
			}

			// Verify no gaps in ordering
			for i := 0; i < len(reorderedChapters)-1; i++ {
				if reorderedChapters[i+1].Order != reorderedChapters[i].Order+1 {
					t.Logf("Gap in chapter ordering between index %d and %d", i, i+1)
					return false
				}
			}

			return true
		},
		gen.IntRange(2, 10), // Test with 2 to 10 chapters
		gen.Int64(),         // Seed for shuffling
	))

	properties.TestingRun(t)
}

// shuffleSlice shuffles a slice of integers using a seed for reproducibility
func shuffleSlice(slice []int, seed int64) {
	// Simple Fisher-Yates shuffle with deterministic seed
	n := len(slice)
	for i := n - 1; i > 0; i-- {
		// Use seed to generate pseudo-random index
		j := int((seed + int64(i)) % int64(i+1))
		if j < 0 {
			j = -j
		}
		slice[i], slice[j] = slice[j], slice[i]
	}
}
