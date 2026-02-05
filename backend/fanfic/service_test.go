package fanfic

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

// createTestAuthorForUnit creates a test author in the database
func createTestAuthorForUnit(t *testing.T, db *gorm.DB) int {
	user := &models.User{
		Username:     "testauthor",
		Email:        "test@example.com",
		PasswordHash: "hashedpassword",
	}
	if err := db.Create(user).Error; err != nil {
		t.Fatalf("Failed to create test author: %v", err)
	}
	return user.ID
}

// TestCreateFanficWithAllFields tests fanfic creation with all fields populated
func TestCreateFanficWithAllFields(t *testing.T) {
	db := setupTestDBForUnit(t)
	authorID := createTestAuthorForUnit(t, db)
	service := NewFanficService(db)

	// Create fanfic with all fields
	title := "My Amazing Fanfic"
	synopsis := "This is a great story about adventures"
	disclaimer := "All characters are fictional"
	category := "Aventura"
	coverFilename := "cover.jpg"
	coverData := []byte{0xFF, 0xD8, 0xFF} // Minimal JPEG header

	isDraft := false
	fanfic, err := service.CreateFanfic(authorID, title, synopsis, disclaimer, category, coverFilename, coverData, false, &isDraft, false, "")
	if err != nil {
		t.Fatalf("Failed to create fanfic: %v", err)
	}

	// Verify all fields
	if fanfic.ID == 0 {
		t.Error("Fanfic ID should not be 0")
	}
	if fanfic.AuthorID != authorID {
		t.Errorf("Expected AuthorID %d, got %d", authorID, fanfic.AuthorID)
	}
	if fanfic.Title != title {
		t.Errorf("Expected Title '%s', got '%s'", title, fanfic.Title)
	}
	if fanfic.Synopsis != synopsis {
		t.Errorf("Expected Synopsis '%s', got '%s'", synopsis, fanfic.Synopsis)
	}
	if fanfic.Disclaimer != disclaimer {
		t.Errorf("Expected Disclaimer '%s', got '%s'", disclaimer, fanfic.Disclaimer)
	}
	if fanfic.Category != category {
		t.Errorf("Expected Category '%s', got '%s'", category, fanfic.Category)
	}
	if fanfic.CoverURL == "" {
		t.Error("CoverURL should not be empty when image is provided")
	}
	if fanfic.InteractiveMode != false {
		t.Error("InteractiveMode should default to false")
	}
}

// TestCreateFanficWithoutCover tests fanfic creation without a cover image
func TestCreateFanficWithoutCover(t *testing.T) {
	db := setupTestDBForUnit(t)
	authorID := createTestAuthorForUnit(t, db)
	service := NewFanficService(db)

	isDraft := false
	fanfic, err := service.CreateFanfic(authorID, "Test Fanfic", "A test synopsis", "", "Romance", "", nil, false, &isDraft, false, "")
	if err != nil {
		t.Fatalf("Failed to create fanfic: %v", err)
	}

	if fanfic.CoverURL != "" {
		t.Errorf("CoverURL should be empty when no image is provided, got '%s'", fanfic.CoverURL)
	}
}

// TestImageFormatValidation tests that invalid image formats are rejected
func TestImageFormatValidation(t *testing.T) {
	db := setupTestDBForUnit(t)
	authorID := createTestAuthorForUnit(t, db)
	service := NewFanficService(db)

	testCases := []struct {
		name     string
		filename string
		wantErr  error
	}{
		{"txt file", "document.txt", ErrInvalidImageFormat},
		{"pdf file", "file.pdf", ErrInvalidImageFormat},
		{"no extension", "noextension", ErrInvalidImageFormat},
		{"exe file", "virus.exe", ErrInvalidImageFormat},
		{"valid jpg", "image.jpg", nil},
		{"valid jpeg", "photo.jpeg", nil},
		{"valid png", "picture.png", nil},
		{"valid gif", "animation.gif", nil},
		{"valid webp", "modern.webp", nil},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			imageData := []byte{0x01, 0x02, 0x03}
			isDraft := false
			_, err := service.CreateFanfic(authorID, "Test", "Synopsis", "", "Romance", tc.filename, imageData, false, &isDraft, false, "")
			
			if tc.wantErr != nil {
				if err != tc.wantErr {
					t.Errorf("Expected error %v, got %v", tc.wantErr, err)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error for valid format, got %v", err)
				}
			}
		})
	}
}

// TestCategoryAssignment tests that fanfics are correctly assigned to categories
func TestCategoryAssignment(t *testing.T) {
	db := setupTestDBForUnit(t)
	authorID := createTestAuthorForUnit(t, db)
	service := NewFanficService(db)

	categories := []string{"Romance", "Aventura", "Fantasia", "Ficção Científica", "Mistério"}

	// Create fanfics in different categories
	for i, category := range categories {
		title := "Fanfic " + string(rune('A'+i))
		isDraft := false
		_, err := service.CreateFanfic(authorID, title, "Synopsis", "", category, "", nil, false, &isDraft, false, "")
		if err != nil {
			t.Fatalf("Failed to create fanfic in category %s: %v", category, err)
		}
	}

	// List fanfics by category
	fanficsByCategory, err := service.ListFanficsByCategory()
	if err != nil {
		t.Fatalf("Failed to list fanfics by category: %v", err)
	}

	// Verify each category has the correct fanfic
	for _, category := range categories {
		fanfics, exists := fanficsByCategory[category]
		if !exists {
			t.Errorf("Category %s not found in results", category)
			continue
		}
		if len(fanfics) != 1 {
			t.Errorf("Expected 1 fanfic in category %s, got %d", category, len(fanfics))
			continue
		}
		if fanfics[0].Category != category {
			t.Errorf("Expected category %s, got %s", category, fanfics[0].Category)
		}
	}
}

// TestUpdateFanfic tests updating fanfic metadata
func TestUpdateFanfic(t *testing.T) {
	db := setupTestDBForUnit(t)
	authorID := createTestAuthorForUnit(t, db)
	service := NewFanficService(db)

	// Create initial fanfic
	isDraft := false
	fanfic, err := service.CreateFanfic(authorID, "Original Title", "Original Synopsis", "", "Romance", "", nil, false, &isDraft, false, "")
	if err != nil {
		t.Fatalf("Failed to create fanfic: %v", err)
	}

	// Update fanfic
	newTitle := "Updated Title"
	newSynopsis := "Updated Synopsis"
	newCategory := "Aventura"
	updatedFanfic, err := service.UpdateFanfic(fanfic.ID, authorID, newTitle, newSynopsis, "", newCategory, "", nil, nil, nil, "")
	if err != nil {
		t.Fatalf("Failed to update fanfic: %v", err)
	}

	// Verify updates
	if updatedFanfic.Title != newTitle {
		t.Errorf("Expected title '%s', got '%s'", newTitle, updatedFanfic.Title)
	}
	if updatedFanfic.Synopsis != newSynopsis {
		t.Errorf("Expected synopsis '%s', got '%s'", newSynopsis, updatedFanfic.Synopsis)
	}
	if updatedFanfic.Category != newCategory {
		t.Errorf("Expected category '%s', got '%s'", newCategory, updatedFanfic.Category)
	}
}

// TestDeleteFanfic tests deleting a fanfic
func TestDeleteFanfic(t *testing.T) {
	db := setupTestDBForUnit(t)
	authorID := createTestAuthorForUnit(t, db)
	service := NewFanficService(db)

	// Create fanfic
	isDraft := false
	fanfic, err := service.CreateFanfic(authorID, "Test Fanfic", "Synopsis", "", "Romance", "", nil, false, &isDraft, false, "")
	if err != nil {
		t.Fatalf("Failed to create fanfic: %v", err)
	}

	// Delete fanfic
	err = service.DeleteFanfic(fanfic.ID, authorID)
	if err != nil {
		t.Fatalf("Failed to delete fanfic: %v", err)
	}

	// Verify fanfic is deleted
	_, err = service.GetFanfic(fanfic.ID)
	if err != ErrFanficNotFound {
		t.Errorf("Expected ErrFanficNotFound, got %v", err)
	}
}

// TestUnauthorizedUpdate tests that non-authors cannot update fanfics
func TestUnauthorizedUpdate(t *testing.T) {
	db := setupTestDBForUnit(t)
	authorID := createTestAuthorForUnit(t, db)
	service := NewFanficService(db)

	// Create another user
	otherUser := &models.User{
		Username:     "otheruser",
		Email:        "other@example.com",
		PasswordHash: "hashedpassword",
	}
	if err := db.Create(otherUser).Error; err != nil {
		t.Fatalf("Failed to create other user: %v", err)
	}

	// Create fanfic as first author
	isDraft := false
	fanfic, err := service.CreateFanfic(authorID, "Test Fanfic", "Synopsis", "", "Romance", "", nil, false, &isDraft, false, "")
	if err != nil {
		t.Fatalf("Failed to create fanfic: %v", err)
	}

	// Try to update as different user
	_, err = service.UpdateFanfic(fanfic.ID, otherUser.ID, "Hacked Title", "", "", "", "", nil, nil, nil, "")
	if err != ErrUnauthorized {
		t.Errorf("Expected ErrUnauthorized, got %v", err)
	}
}

// TestUnauthorizedDelete tests that non-authors cannot delete fanfics
func TestUnauthorizedDelete(t *testing.T) {
	db := setupTestDBForUnit(t)
	authorID := createTestAuthorForUnit(t, db)
	service := NewFanficService(db)

	// Create another user
	otherUser := &models.User{
		Username:     "otheruser",
		Email:        "other@example.com",
		PasswordHash: "hashedpassword",
	}
	if err := db.Create(otherUser).Error; err != nil {
		t.Fatalf("Failed to create other user: %v", err)
	}

	// Create fanfic as first author
	isDraft := false
	fanfic, err := service.CreateFanfic(authorID, "Test Fanfic", "Synopsis", "", "Romance", "", nil, false, &isDraft, false, "")
	if err != nil {
		t.Fatalf("Failed to create fanfic: %v", err)
	}

	// Try to delete as different user
	err = service.DeleteFanfic(fanfic.ID, otherUser.ID)
	if err != ErrUnauthorized {
		t.Errorf("Expected ErrUnauthorized, got %v", err)
	}

	// Verify fanfic still exists
	_, err = service.GetFanfic(fanfic.ID)
	if err != nil {
		t.Errorf("Fanfic should still exist, got error: %v", err)
	}
}

// TestValidationErrors tests that validation errors are returned correctly
func TestValidationErrors(t *testing.T) {
	db := setupTestDBForUnit(t)
	authorID := createTestAuthorForUnit(t, db)
	service := NewFanficService(db)

	testCases := []struct {
		name      string
		title     string
		synopsis  string
		category  string
		wantErr   error
	}{
		{"empty title", "", "Synopsis", "Romance", ErrTitleRequired},
		{"whitespace title", "   ", "Synopsis", "Romance", ErrTitleRequired},
		{"empty synopsis", "Title", "", "Romance", ErrSynopsisRequired},
		{"whitespace synopsis", "Title", "   ", "Romance", ErrSynopsisRequired},
		{"empty category", "Title", "Synopsis", "", ErrCategoryRequired},
		{"whitespace category", "Title", "Synopsis", "   ", ErrCategoryRequired},
		{"valid input", "Title", "Synopsis", "Romance", nil},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			isDraft := false
			_, err := service.CreateFanfic(authorID, tc.title, tc.synopsis, "", tc.category, "", nil, false, &isDraft, false, "")
			if tc.wantErr != nil {
				if err != tc.wantErr {
					t.Errorf("Expected error %v, got %v", tc.wantErr, err)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got %v", err)
				}
			}
		})
	}
}
