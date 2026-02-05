package comment

import (
	"testing"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDBUnit creates an in-memory SQLite database for unit testing
func setupTestDBUnit(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Auto-migrate all models
	if err := db.AutoMigrate(&models.User{}, &models.Fanfic{}, &models.Chapter{}, &models.Comment{}); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

// Helper function to create a test user
func createTestUserUnit(db *gorm.DB, username, email string) (*models.User, error) {
	user := &models.User{
		Username:     username,
		Email:        email,
		PasswordHash: "test-hash",
	}
	err := db.Create(user).Error
	return user, err
}

// Helper function to create a test fanfic
func createTestFanficUnit(db *gorm.DB, authorID int, title string) (*models.Fanfic, error) {
	fanfic := &models.Fanfic{
		AuthorID:   authorID,
		Title:      title,
		Synopsis:   "Test synopsis",
		Category:   "Test",
		CoverURL:   "test.jpg",
		Disclaimer: "Test disclaimer",
	}
	err := db.Create(fanfic).Error
	return fanfic, err
}

// Helper function to create a test chapter
func createTestChapterUnit(db *gorm.DB, fanficID int, title string, order int) (*models.Chapter, error) {
	chapter := &models.Chapter{
		FanficID: fanficID,
		Title:    title,
		Content:  "Test content",
		Order:    order,
	}
	err := db.Create(chapter).Error
	return chapter, err
}

func TestCreateComment_Success(t *testing.T) {
	db := setupTestDBUnit(t)
	commentService := NewCommentService(db)

	// Create test user and fanfic
	user, err := createTestUserUnit(db, "testuser", "test@example.com")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	fanfic, err := createTestFanficUnit(db, user.ID, "Test Fanfic")
	if err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}

	// Create comment
	comment, err := commentService.CreateComment(user.ID, fanfic.ID, nil, "This is a test comment")
	if err != nil {
		t.Fatalf("Failed to create comment: %v", err)
	}

	// Verify comment
	if comment.ID == 0 {
		t.Error("Comment ID should not be 0")
	}
	if comment.UserID != user.ID {
		t.Errorf("Expected UserID %d, got %d", user.ID, comment.UserID)
	}
	if comment.FanficID != fanfic.ID {
		t.Errorf("Expected FanficID %d, got %d", fanfic.ID, comment.FanficID)
	}
	if comment.Content != "This is a test comment" {
		t.Errorf("Expected content 'This is a test comment', got '%s'", comment.Content)
	}
	if comment.ChapterID != nil {
		t.Error("ChapterID should be nil for fanfic comment")
	}
}

func TestCreateComment_EmptyContent(t *testing.T) {
	db := setupTestDBUnit(t)
	commentService := NewCommentService(db)

	// Create test user and fanfic
	user, err := createTestUserUnit(db, "testuser", "test@example.com")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	fanfic, err := createTestFanficUnit(db, user.ID, "Test Fanfic")
	if err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}

	// Try to create comment with empty content
	_, err = commentService.CreateComment(user.ID, fanfic.ID, nil, "")
	if err != ErrContentRequired {
		t.Errorf("Expected ErrContentRequired, got %v", err)
	}

	// Try with whitespace only
	_, err = commentService.CreateComment(user.ID, fanfic.ID, nil, "   ")
	if err != ErrContentRequired {
		t.Errorf("Expected ErrContentRequired for whitespace content, got %v", err)
	}
}

func TestCreateComment_OnChapter(t *testing.T) {
	db := setupTestDBUnit(t)
	commentService := NewCommentService(db)

	// Create test user, fanfic, and chapter
	user, err := createTestUserUnit(db, "testuser", "test@example.com")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	fanfic, err := createTestFanficUnit(db, user.ID, "Test Fanfic")
	if err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}

	chapter, err := createTestChapterUnit(db, fanfic.ID, "Chapter 1", 1)
	if err != nil {
		t.Fatalf("Failed to create test chapter: %v", err)
	}

	// Create comment on chapter
	chapterID := chapter.ID
	comment, err := commentService.CreateComment(user.ID, fanfic.ID, &chapterID, "Chapter comment")
	if err != nil {
		t.Fatalf("Failed to create comment: %v", err)
	}

	// Verify comment
	if comment.ChapterID == nil {
		t.Error("ChapterID should not be nil for chapter comment")
	} else if *comment.ChapterID != chapter.ID {
		t.Errorf("Expected ChapterID %d, got %d", chapter.ID, *comment.ChapterID)
	}
}

func TestDeleteComment_Authorized(t *testing.T) {
	db := setupTestDBUnit(t)
	commentService := NewCommentService(db)

	// Create test user and fanfic
	user, err := createTestUserUnit(db, "testuser", "test@example.com")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	fanfic, err := createTestFanficUnit(db, user.ID, "Test Fanfic")
	if err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}

	// Create comment
	comment, err := commentService.CreateComment(user.ID, fanfic.ID, nil, "Test comment")
	if err != nil {
		t.Fatalf("Failed to create comment: %v", err)
	}

	// Delete comment as author
	err = commentService.DeleteComment(comment.ID, user.ID, fanfic.AuthorID)
	if err != nil {
		t.Errorf("Failed to delete comment: %v", err)
	}

	// Verify comment is deleted
	_, err = commentService.GetComment(comment.ID)
	if err != ErrCommentNotFound {
		t.Errorf("Expected ErrCommentNotFound, got %v", err)
	}
}

func TestDeleteComment_Unauthorized(t *testing.T) {
	db := setupTestDBUnit(t)
	commentService := NewCommentService(db)

	// Create test users
	user1, err := createTestUserUnit(db, "user1", "user1@example.com")
	if err != nil {
		t.Fatalf("Failed to create test user1: %v", err)
	}

	user2, err := createTestUserUnit(db, "user2", "user2@example.com")
	if err != nil {
		t.Fatalf("Failed to create test user2: %v", err)
	}

	// Create fanfic by user1
	fanfic, err := createTestFanficUnit(db, user1.ID, "Test Fanfic")
	if err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}

	// Create comment by user1
	comment, err := commentService.CreateComment(user1.ID, fanfic.ID, nil, "Test comment")
	if err != nil {
		t.Fatalf("Failed to create comment: %v", err)
	}

	// Try to delete comment as user2 (unauthorized)
	err = commentService.DeleteComment(comment.ID, user2.ID, fanfic.AuthorID)
	if err != ErrUnauthorized {
		t.Errorf("Expected ErrUnauthorized, got %v", err)
	}

	// Verify comment still exists
	retrievedComment, err := commentService.GetComment(comment.ID)
	if err != nil {
		t.Errorf("Comment should still exist: %v", err)
	}
	if retrievedComment.ID != comment.ID {
		t.Error("Retrieved comment ID mismatch")
	}
}

func TestDeleteComment_FanficOwner(t *testing.T) {
	db := setupTestDBUnit(t)
	commentService := NewCommentService(db)

	// Create test users
	author, err := createTestUserUnit(db, "author", "author@example.com")
	if err != nil {
		t.Fatalf("Failed to create author: %v", err)
	}

	commenter, err := createTestUserUnit(db, "commenter", "commenter@example.com")
	if err != nil {
		t.Fatalf("Failed to create commenter: %v", err)
	}

	// Create fanfic by author
	fanfic, err := createTestFanficUnit(db, author.ID, "Test Fanfic")
	if err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}

	// Create comment by commenter
	comment, err := commentService.CreateComment(commenter.ID, fanfic.ID, nil, "Test comment")
	if err != nil {
		t.Fatalf("Failed to create comment: %v", err)
	}

	// Delete comment as fanfic owner (author)
	err = commentService.DeleteComment(comment.ID, author.ID, fanfic.AuthorID)
	if err != nil {
		t.Errorf("Fanfic owner should be able to delete comment: %v", err)
	}

	// Verify comment is deleted
	_, err = commentService.GetComment(comment.ID)
	if err != ErrCommentNotFound {
		t.Errorf("Expected ErrCommentNotFound, got %v", err)
	}
}

func TestListFanficComments(t *testing.T) {
	db := setupTestDBUnit(t)
	commentService := NewCommentService(db)

	// Create test user and fanfic
	user, err := createTestUserUnit(db, "testuser", "test@example.com")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	fanfic, err := createTestFanficUnit(db, user.ID, "Test Fanfic")
	if err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}

	// Create multiple comments
	for i := 1; i <= 3; i++ {
		_, err := commentService.CreateComment(user.ID, fanfic.ID, nil, "Comment "+string(rune('0'+i)))
		if err != nil {
			t.Fatalf("Failed to create comment %d: %v", i, err)
		}
	}

	// List comments
	comments, err := commentService.ListFanficComments(fanfic.ID)
	if err != nil {
		t.Fatalf("Failed to list comments: %v", err)
	}

	// Verify count
	if len(comments) != 3 {
		t.Errorf("Expected 3 comments, got %d", len(comments))
	}

	// Verify chronological order
	for i := 1; i < len(comments); i++ {
		if comments[i].CreatedAt.Before(comments[i-1].CreatedAt) {
			t.Error("Comments not in chronological order")
		}
	}
}

func TestListChapterComments(t *testing.T) {
	db := setupTestDBUnit(t)
	commentService := NewCommentService(db)

	// Create test user, fanfic, and chapter
	user, err := createTestUserUnit(db, "testuser", "test@example.com")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	fanfic, err := createTestFanficUnit(db, user.ID, "Test Fanfic")
	if err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}

	chapter, err := createTestChapterUnit(db, fanfic.ID, "Chapter 1", 1)
	if err != nil {
		t.Fatalf("Failed to create test chapter: %v", err)
	}

	// Create multiple comments on chapter
	chapterID := chapter.ID
	for i := 1; i <= 3; i++ {
		_, err := commentService.CreateComment(user.ID, fanfic.ID, &chapterID, "Chapter comment "+string(rune('0'+i)))
		if err != nil {
			t.Fatalf("Failed to create comment %d: %v", i, err)
		}
	}

	// List chapter comments
	comments, err := commentService.ListChapterComments(chapter.ID)
	if err != nil {
		t.Fatalf("Failed to list chapter comments: %v", err)
	}

	// Verify count
	if len(comments) != 3 {
		t.Errorf("Expected 3 comments, got %d", len(comments))
	}

	// Verify all comments are for the chapter
	for _, comment := range comments {
		if comment.ChapterID == nil || *comment.ChapterID != chapter.ID {
			t.Error("Comment not associated with correct chapter")
		}
	}
}
