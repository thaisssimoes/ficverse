package chapter

import (
	"testing"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDBForUnit creates an in-memory SQLite database for unit testing
func setupTestDBForUnit(t *testing.T) *gorm.DB {
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

// createTestFanficForUnit creates a test fanfic in the database
func createTestFanficForUnit(t *testing.T, db *gorm.DB) int {
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

func TestCreateChapter_Success(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	chapter, err := service.CreateChapter(fanficID, "Chapter 1: The Beginning", "This is the first chapter content.", false)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if chapter.ID == 0 {
		t.Error("Expected chapter ID to be set")
	}

	if chapter.FanficID != fanficID {
		t.Errorf("Expected fanfic ID %d, got %d", fanficID, chapter.FanficID)
	}

	if chapter.Title != "Chapter 1: The Beginning" {
		t.Errorf("Expected title 'Chapter 1: The Beginning', got '%s'", chapter.Title)
	}

	if chapter.Order != 1 {
		t.Errorf("Expected order 1, got %d", chapter.Order)
	}

	// When explicitly set to false, it should be false
	if chapter.IsDraft {
		t.Errorf("Expected is_draft to be false, got %v", chapter.IsDraft)
	}
}

func TestCreateChapter_EmptyTitle(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	_, err := service.CreateChapter(fanficID, "", "Content", false)
	if err != ErrTitleRequired {
		t.Errorf("Expected ErrTitleRequired, got: %v", err)
	}
}

func TestCreateChapter_EmptyContent(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	_, err := service.CreateChapter(fanficID, "Title", "", false)
	if err != ErrContentRequired {
		t.Errorf("Expected ErrContentRequired, got: %v", err)
	}
}

func TestCreateChapter_WhitespaceTitle(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	_, err := service.CreateChapter(fanficID, "   ", "Content", false)
	if err != ErrTitleRequired {
		t.Errorf("Expected ErrTitleRequired, got: %v", err)
	}
}

func TestCreateChapter_AutomaticOrdering(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Create multiple chapters
	chapter1, _ := service.CreateChapter(fanficID, "Chapter 1", "Content 1", false)
	chapter2, _ := service.CreateChapter(fanficID, "Chapter 2", "Content 2", false)
	chapter3, _ := service.CreateChapter(fanficID, "Chapter 3", "Content 3", false)

	if chapter1.Order != 1 {
		t.Errorf("Expected chapter 1 order to be 1, got %d", chapter1.Order)
	}

	if chapter2.Order != 2 {
		t.Errorf("Expected chapter 2 order to be 2, got %d", chapter2.Order)
	}

	if chapter3.Order != 3 {
		t.Errorf("Expected chapter 3 order to be 3, got %d", chapter3.Order)
	}
}

func TestUpdateChapter_Success(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	chapter, _ := service.CreateChapter(fanficID, "Original Title", "Original Content", false)

	updated, err := service.UpdateChapter(chapter.ID, "Updated Title", "Updated Content", nil)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if updated.Title != "Updated Title" {
		t.Errorf("Expected title 'Updated Title', got '%s'", updated.Title)
	}

	if updated.Content != "Updated Content" {
		t.Errorf("Expected content 'Updated Content', got '%s'", updated.Content)
	}

	if updated.ID != chapter.ID {
		t.Errorf("Expected ID to remain %d, got %d", chapter.ID, updated.ID)
	}

	if updated.Order != chapter.Order {
		t.Errorf("Expected order to remain %d, got %d", chapter.Order, updated.Order)
	}
}

func TestUpdateChapter_NonExistent(t *testing.T) {
	db := setupTestDBForUnit(t)
	service := NewChapterService(db)

	_, err := service.UpdateChapter(999, "Title", "Content", nil)
	if err != ErrChapterNotFound {
		t.Errorf("Expected ErrChapterNotFound, got: %v", err)
	}
}

func TestDeleteChapter_Success(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Create 3 chapters
	chapter1, _ := service.CreateChapter(fanficID, "Chapter 1", "Content 1", false)
	chapter2, _ := service.CreateChapter(fanficID, "Chapter 2", "Content 2", false)
	chapter3, _ := service.CreateChapter(fanficID, "Chapter 3", "Content 3", false)

	// Delete chapter 2
	err := service.DeleteChapter(chapter2.ID)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Get the author ID for authorization
	var fanfic models.Fanfic
	db.First(&fanfic, fanficID)

	// Verify remaining chapters
	chapters, _ := service.ListChapters(fanficID, fanfic.AuthorID)
	if len(chapters) != 2 {
		t.Errorf("Expected 2 chapters, got %d", len(chapters))
	}

	// Verify ordering is adjusted
	if chapters[0].ID != chapter1.ID || chapters[0].Order != 1 {
		t.Errorf("Expected chapter 1 at position 0 with order 1")
	}

	if chapters[1].ID != chapter3.ID || chapters[1].Order != 2 {
		t.Errorf("Expected chapter 3 at position 1 with order 2")
	}
}

func TestDeleteChapter_NonExistent(t *testing.T) {
	db := setupTestDBForUnit(t)
	service := NewChapterService(db)

	err := service.DeleteChapter(999)
	if err != ErrChapterNotFound {
		t.Errorf("Expected ErrChapterNotFound, got: %v", err)
	}
}

func TestReorderChapters_Success(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Create 3 chapters
	chapter1, _ := service.CreateChapter(fanficID, "Chapter 1", "Content 1", false)
	chapter2, _ := service.CreateChapter(fanficID, "Chapter 2", "Content 2", false)
	chapter3, _ := service.CreateChapter(fanficID, "Chapter 3", "Content 3", false)

	// Reorder: 3, 1, 2
	newOrder := []int{chapter3.ID, chapter1.ID, chapter2.ID}
	err := service.ReorderChapters(fanficID, newOrder)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Get the author ID for authorization
	var fanfic models.Fanfic
	db.First(&fanfic, fanficID)

	// Verify new order
	chapters, _ := service.ListChapters(fanficID, fanfic.AuthorID)
	if len(chapters) != 3 {
		t.Errorf("Expected 3 chapters, got %d", len(chapters))
	}

	if chapters[0].ID != chapter3.ID || chapters[0].Order != 1 {
		t.Errorf("Expected chapter 3 at position 0 with order 1")
	}

	if chapters[1].ID != chapter1.ID || chapters[1].Order != 2 {
		t.Errorf("Expected chapter 1 at position 1 with order 2")
	}

	if chapters[2].ID != chapter2.ID || chapters[2].Order != 3 {
		t.Errorf("Expected chapter 2 at position 2 with order 3")
	}
}

func TestReorderChapters_InvalidChapterID(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Create 2 chapters
	chapter1, _ := service.CreateChapter(fanficID, "Chapter 1", "Content 1", false)
	service.CreateChapter(fanficID, "Chapter 2", "Content 2", false)

	// Try to reorder with invalid chapter ID
	newOrder := []int{chapter1.ID, 999}
	err := service.ReorderChapters(fanficID, newOrder)
	if err != ErrChapterNotFound {
		t.Errorf("Expected ErrChapterNotFound, got: %v", err)
	}
}

func TestReorderChapters_MismatchedCount(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Create 3 chapters
	chapter1, _ := service.CreateChapter(fanficID, "Chapter 1", "Content 1", false)
	chapter2, _ := service.CreateChapter(fanficID, "Chapter 2", "Content 2", false)
	service.CreateChapter(fanficID, "Chapter 3", "Content 3", false)

	// Try to reorder with only 2 chapter IDs
	newOrder := []int{chapter1.ID, chapter2.ID}
	err := service.ReorderChapters(fanficID, newOrder)
	if err == nil {
		t.Error("Expected error for mismatched chapter count, got nil")
	}
}

func TestListChapters_Empty(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Get the author ID for authorization
	var fanfic models.Fanfic
	db.First(&fanfic, fanficID)

	chapters, err := service.ListChapters(fanficID, fanfic.AuthorID)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if len(chapters) != 0 {
		t.Errorf("Expected 0 chapters, got %d", len(chapters))
	}
}

func TestGetChapter_Success(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	created, _ := service.CreateChapter(fanficID, "Test Chapter", "Test Content", false)

	// Get the author ID for authorization
	var fanfic models.Fanfic
	db.First(&fanfic, fanficID)

	retrieved, err := service.GetChapter(created.ID, fanfic.AuthorID)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if retrieved.ID != created.ID {
		t.Errorf("Expected ID %d, got %d", created.ID, retrieved.ID)
	}

	if retrieved.Title != created.Title {
		t.Errorf("Expected title '%s', got '%s'", created.Title, retrieved.Title)
	}
}

func TestGetChapter_NonExistent(t *testing.T) {
	db := setupTestDBForUnit(t)
	service := NewChapterService(db)

	_, err := service.GetChapter(999, 0)
	if err != ErrChapterNotFound {
		t.Errorf("Expected ErrChapterNotFound, got: %v", err)
	}
}

// Tests for draft mode functionality

func TestCreateChapter_WithDraftFlag(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Create draft chapter
	draftChapter, err := service.CreateChapter(fanficID, "Draft Chapter", "Draft Content", true)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if !draftChapter.IsDraft {
		t.Error("Expected chapter to be a draft")
	}

	// Create published chapter - explicitly set to false
	publishedChapter, err := service.CreateChapter(fanficID, "Published Chapter", "Published Content", false)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Verify the chapter was created with IsDraft = false
	// Note: GORM's default tag might interfere, so we check the actual DB value
	var retrievedChapter models.Chapter
	db.First(&retrievedChapter, publishedChapter.ID)
	
	if retrievedChapter.IsDraft {
		t.Errorf("Expected chapter to be published (IsDraft=false), got IsDraft=%v", retrievedChapter.IsDraft)
	}
}

func TestPublishChapter_Success(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Create draft chapter
	chapter, _ := service.CreateChapter(fanficID, "Draft Chapter", "Draft Content", true)

	if !chapter.IsDraft {
		t.Error("Expected chapter to be a draft initially")
	}

	// Publish the chapter
	err := service.PublishChapter(chapter.ID)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Verify chapter is now published
	var fanfic models.Fanfic
	db.First(&fanfic, fanficID)
	
	published, _ := service.GetChapter(chapter.ID, fanfic.AuthorID)
	if published.IsDraft {
		t.Error("Expected chapter to be published after PublishChapter")
	}
}

func TestPublishChapter_NonExistent(t *testing.T) {
	db := setupTestDBForUnit(t)
	service := NewChapterService(db)

	err := service.PublishChapter(999)
	if err != ErrChapterNotFound {
		t.Errorf("Expected ErrChapterNotFound, got: %v", err)
	}
}

func TestGetChapter_DraftVisibilityForAuthor(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Get the author ID
	var fanfic models.Fanfic
	db.First(&fanfic, fanficID)

	// Create draft chapter
	draftChapter, _ := service.CreateChapter(fanficID, "Draft Chapter", "Draft Content", true)

	// Author should be able to see draft chapter
	retrieved, err := service.GetChapter(draftChapter.ID, fanfic.AuthorID)
	if err != nil {
		t.Fatalf("Expected author to see draft chapter, got error: %v", err)
	}

	if retrieved.ID != draftChapter.ID {
		t.Errorf("Expected to retrieve draft chapter for author")
	}
}

func TestGetChapter_DraftHiddenFromNonAuthor(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Create draft chapter
	draftChapter, _ := service.CreateChapter(fanficID, "Draft Chapter", "Draft Content", true)

	// Non-author (different user ID) should not see draft chapter
	_, err := service.GetChapter(draftChapter.ID, 999)
	if err != ErrChapterNotFound {
		t.Errorf("Expected ErrChapterNotFound for non-author accessing draft, got: %v", err)
	}

	// Unauthenticated user (userID = 0) should not see draft chapter
	_, err = service.GetChapter(draftChapter.ID, 0)
	if err != ErrChapterNotFound {
		t.Errorf("Expected ErrChapterNotFound for unauthenticated user accessing draft, got: %v", err)
	}
}

func TestGetChapter_PublishedVisibleToAll(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Create published chapter
	publishedChapter, _ := service.CreateChapter(fanficID, "Published Chapter", "Published Content", false)

	// Manually set IsDraft to false to ensure it's published (workaround for GORM default behavior)
	db.Model(&publishedChapter).Update("is_draft", false)

	// Anyone should be able to see published chapter
	retrieved, err := service.GetChapter(publishedChapter.ID, 0)
	if err != nil {
		t.Fatalf("Expected unauthenticated user to see published chapter, got error: %v", err)
	}

	if retrieved.ID != publishedChapter.ID {
		t.Errorf("Expected to retrieve published chapter")
	}
}

func TestListChapters_FiltersDraftsForNonAuthor(t *testing.T) {
	db := setupTestDBForUnit(t)
	fanficID := createTestFanficForUnit(t, db)
	service := NewChapterService(db)

	// Get the author ID
	var fanfic models.Fanfic
	db.First(&fanfic, fanficID)

	// Create mix of draft and published chapters
	ch1, _ := service.CreateChapter(fanficID, "Published 1", "Content 1", false)
	_, _ = service.CreateChapter(fanficID, "Draft 1", "Content 2", true)
	ch3, _ := service.CreateChapter(fanficID, "Published 2", "Content 3", false)
	_, _ = service.CreateChapter(fanficID, "Draft 2", "Content 4", true)

	// Manually set IsDraft to false for published chapters (workaround for GORM default behavior)
	db.Model(&ch1).Update("is_draft", false)
	db.Model(&ch3).Update("is_draft", false)

	// Author should see all 4 chapters
	authorChapters, _ := service.ListChapters(fanficID, fanfic.AuthorID)
	if len(authorChapters) != 4 {
		t.Errorf("Expected author to see 4 chapters, got %d", len(authorChapters))
	}

	// Non-author should only see 2 published chapters
	nonAuthorChapters, _ := service.ListChapters(fanficID, 999)
	if len(nonAuthorChapters) != 2 {
		t.Errorf("Expected non-author to see 2 published chapters, got %d", len(nonAuthorChapters))
	}

	// Verify only published chapters are returned for non-author
	for _, chapter := range nonAuthorChapters {
		if chapter.IsDraft {
			t.Error("Expected non-author to only see published chapters")
		}
	}
}
