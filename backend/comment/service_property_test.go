package comment

import (
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
	if err := db.AutoMigrate(&models.User{}, &models.Fanfic{}, &models.Chapter{}, &models.Comment{}); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

// Helper function to create a test user
func createTestUser(db *gorm.DB, username, email string) (*models.User, error) {
	user := &models.User{
		Username:     username,
		Email:        email,
		PasswordHash: "test-hash",
	}
	err := db.Create(user).Error
	return user, err
}

// Helper function to create a test fanfic
func createTestFanfic(db *gorm.DB, authorID int, title string) (*models.Fanfic, error) {
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
func createTestChapter(db *gorm.DB, fanficID int, title string, order int) (*models.Chapter, error) {
	chapter := &models.Chapter{
		FanficID: fanficID,
		Title:    title,
		Content:  "Test content",
		Order:    order,
	}
	err := db.Create(chapter).Error
	return chapter, err
}

// Generators for valid input data

func genValidContent() gopter.Gen {
	// Generate content that starts and ends with non-whitespace
	return gen.RegexMatch("[a-zA-Z0-9.,!?][a-zA-Z0-9 .,!?]{0,498}[a-zA-Z0-9.,!?]")
}

func genValidUsername() gopter.Gen {
	return gen.RegexMatch("[a-zA-Z][a-zA-Z0-9_]{2,49}")
}

func genValidEmail() gopter.Gen {
	return gen.RegexMatch("[a-zA-Z][a-zA-Z0-9]{2,29}").Map(func(s string) string {
		return s + "@example.com"
	})
}

func genValidTitle() gopter.Gen {
	return gen.RegexMatch("[a-zA-Z][a-zA-Z0-9 ]{2,99}")
}

// Feature: interactive-fanfic-platform, Property 33: Comments are stored with metadata
func TestProperty_CommentsAreStoredWithMetadata(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	// Test comments on fanfics
	properties.Property("fanfic comments are stored with metadata", prop.ForAll(
		func(username, email, fanficTitle, content string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			commentService := NewCommentService(db)

			// Create test user
			user, err := createTestUser(db, username, email)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create test fanfic
			fanfic, err := createTestFanfic(db, user.ID, fanficTitle)
			if err != nil {
				return true // Skip if fanfic creation fails
			}

			// Create comment on fanfic
			comment, err := commentService.CreateComment(user.ID, fanfic.ID, nil, content)
			if err != nil {
				// Skip if content validation fails (e.g., empty after trimming)
				return true
			}

			// Verify comment has an ID
			if comment.ID == 0 {
				t.Logf("Comment ID should not be 0")
				return false
			}

			// Verify comment metadata
			if comment.UserID != user.ID {
				t.Logf("Comment UserID mismatch: expected %d, got %d", user.ID, comment.UserID)
				return false
			}

			if comment.FanficID != fanfic.ID {
				t.Logf("Comment FanficID mismatch: expected %d, got %d", fanfic.ID, comment.FanficID)
				return false
			}

			if comment.ChapterID != nil {
				t.Logf("Comment ChapterID should be nil for fanfic comment, got %v", comment.ChapterID)
				return false
			}

			// Content should match (service trims whitespace)
			if comment.Content != content {
				t.Logf("Comment content mismatch: expected %s, got %s", content, comment.Content)
				return false
			}

			if comment.CreatedAt.IsZero() {
				t.Logf("Comment CreatedAt should not be zero")
				return false
			}

			// Verify comment can be retrieved
			retrieved, err := commentService.GetComment(comment.ID)
			if err != nil {
				t.Logf("Failed to retrieve comment: %v", err)
				return false
			}

			if retrieved.ID != comment.ID {
				t.Logf("Retrieved comment ID mismatch")
				return false
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidTitle(),
		genValidContent(),
	))

	// Test comments on chapters
	properties.Property("chapter comments are stored with metadata", prop.ForAll(
		func(username, email, fanficTitle, chapterTitle, content string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			commentService := NewCommentService(db)

			// Create test user
			user, err := createTestUser(db, username, email)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create test fanfic
			fanfic, err := createTestFanfic(db, user.ID, fanficTitle)
			if err != nil {
				return true // Skip if fanfic creation fails
			}

			// Create test chapter
			chapter, err := createTestChapter(db, fanfic.ID, chapterTitle, 1)
			if err != nil {
				return true // Skip if chapter creation fails
			}

			// Create comment on chapter
			chapterID := chapter.ID
			comment, err := commentService.CreateComment(user.ID, fanfic.ID, &chapterID, content)
			if err != nil {
				// Skip if content validation fails (e.g., empty after trimming)
				return true
			}

			// Verify comment has an ID
			if comment.ID == 0 {
				t.Logf("Comment ID should not be 0")
				return false
			}

			// Verify comment metadata
			if comment.UserID != user.ID {
				t.Logf("Comment UserID mismatch: expected %d, got %d", user.ID, comment.UserID)
				return false
			}

			if comment.FanficID != fanfic.ID {
				t.Logf("Comment FanficID mismatch: expected %d, got %d", fanfic.ID, comment.FanficID)
				return false
			}

			if comment.ChapterID == nil || *comment.ChapterID != chapter.ID {
				t.Logf("Comment ChapterID mismatch: expected %d, got %v", chapter.ID, comment.ChapterID)
				return false
			}

			// Content should match (service trims whitespace)
			if comment.Content != content {
				t.Logf("Comment content mismatch: expected %s, got %s", content, comment.Content)
				return false
			}

			if comment.CreatedAt.IsZero() {
				t.Logf("Comment CreatedAt should not be zero")
				return false
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidTitle(),
		genValidTitle(),
		genValidContent(),
	))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 34: Comments are ordered chronologically
func TestProperty_CommentsAreOrderedChronologically(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("comments are ordered chronologically", prop.ForAll(
		func(username, email, fanficTitle string, numComments uint8) bool {
			// Limit number of comments to reasonable range
			if numComments < 2 || numComments > 10 {
				return true // Skip if not enough comments to test ordering
			}

			// Setup fresh database for each test
			db := setupTestDB(t)
			commentService := NewCommentService(db)

			// Create test user
			user, err := createTestUser(db, username, email)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create test fanfic
			fanfic, err := createTestFanfic(db, user.ID, fanficTitle)
			if err != nil {
				return true // Skip if fanfic creation fails
			}

			// Create multiple comments
			var commentIDs []int
			for i := uint8(0); i < numComments; i++ {
				contentVal, ok := gen.Identifier().Sample()
				if !ok {
					return true // Skip if generator fails
				}
				content := contentVal.(string)
				comment, err := commentService.CreateComment(user.ID, fanfic.ID, nil, content)
				if err != nil {
					t.Logf("Failed to create comment %d: %v", i, err)
					return false
				}
				commentIDs = append(commentIDs, comment.ID)
			}

			// Retrieve all comments for the fanfic
			comments, err := commentService.ListFanficComments(fanfic.ID)
			if err != nil {
				t.Logf("Failed to list comments: %v", err)
				return false
			}

			// Verify we got all comments
			if len(comments) != int(numComments) {
				t.Logf("Expected %d comments, got %d", numComments, len(comments))
				return false
			}

			// Verify comments are ordered chronologically (oldest first)
			for i := 1; i < len(comments); i++ {
				if comments[i].CreatedAt.Before(comments[i-1].CreatedAt) {
					t.Logf("Comments not in chronological order: comment[%d].CreatedAt=%v is before comment[%d].CreatedAt=%v",
						i, comments[i].CreatedAt, i-1, comments[i-1].CreatedAt)
					return false
				}
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidTitle(),
		gen.UInt8(),
	))

	// Test chapter comments ordering
	properties.Property("chapter comments are ordered chronologically", prop.ForAll(
		func(username, email, fanficTitle, chapterTitle string, numComments uint8) bool {
			// Limit number of comments to reasonable range
			if numComments < 2 || numComments > 10 {
				return true // Skip if not enough comments to test ordering
			}

			// Setup fresh database for each test
			db := setupTestDB(t)
			commentService := NewCommentService(db)

			// Create test user
			user, err := createTestUser(db, username, email)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create test fanfic
			fanfic, err := createTestFanfic(db, user.ID, fanficTitle)
			if err != nil {
				return true // Skip if fanfic creation fails
			}

			// Create test chapter
			chapter, err := createTestChapter(db, fanfic.ID, chapterTitle, 1)
			if err != nil {
				return true // Skip if chapter creation fails
			}

			// Create multiple comments
			chapterID := chapter.ID
			for i := uint8(0); i < numComments; i++ {
				contentVal, ok := gen.Identifier().Sample()
				if !ok {
					return true // Skip if generator fails
				}
				content := contentVal.(string)
				_, err := commentService.CreateComment(user.ID, fanfic.ID, &chapterID, content)
				if err != nil {
					t.Logf("Failed to create comment %d: %v", i, err)
					return false
				}
			}

			// Retrieve all comments for the chapter
			comments, err := commentService.ListChapterComments(chapter.ID)
			if err != nil {
				t.Logf("Failed to list comments: %v", err)
				return false
			}

			// Verify we got all comments
			if len(comments) != int(numComments) {
				t.Logf("Expected %d comments, got %d", numComments, len(comments))
				return false
			}

			// Verify comments are ordered chronologically (oldest first)
			for i := 1; i < len(comments); i++ {
				if comments[i].CreatedAt.Before(comments[i-1].CreatedAt) {
					t.Logf("Comments not in chronological order: comment[%d].CreatedAt=%v is before comment[%d].CreatedAt=%v",
						i, comments[i].CreatedAt, i-1, comments[i-1].CreatedAt)
					return false
				}
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidTitle(),
		genValidTitle(),
		gen.UInt8(),
	))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 37: Comment deletion authorization
func TestProperty_CommentDeletionAuthorization(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	// Test that comment author can delete their own comment
	properties.Property("comment author can delete their own comment", prop.ForAll(
		func(username, email, fanficTitle, content string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			commentService := NewCommentService(db)

			// Create test user (comment author)
			user, err := createTestUser(db, username, email)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create test fanfic
			fanfic, err := createTestFanfic(db, user.ID, fanficTitle)
			if err != nil {
				return true // Skip if fanfic creation fails
			}

			// Create comment
			comment, err := commentService.CreateComment(user.ID, fanfic.ID, nil, content)
			if err != nil {
				// Skip if content validation fails
				return true
			}

			// Comment author should be able to delete their own comment
			err = commentService.DeleteComment(comment.ID, user.ID, fanfic.AuthorID)
			if err != nil {
				t.Logf("Comment author should be able to delete their own comment, got error: %v", err)
				return false
			}

			// Verify comment is deleted
			_, err = commentService.GetComment(comment.ID)
			if err != ErrCommentNotFound {
				t.Logf("Comment should be deleted, got error: %v", err)
				return false
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidTitle(),
		genValidContent(),
	))

	// Test that fanfic owner can delete comments on their fanfic
	properties.Property("fanfic owner can delete comments on their fanfic", prop.ForAll(
		func(authorUsername, authorEmail, commenterUsername, commenterEmail, fanficTitle, content string) bool {
			// Ensure different users
			if authorEmail == commenterEmail {
				return true // Skip if same user
			}

			// Setup fresh database for each test
			db := setupTestDB(t)
			commentService := NewCommentService(db)

			// Create fanfic author
			author, err := createTestUser(db, authorUsername, authorEmail)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create commenter
			commenter, err := createTestUser(db, commenterUsername, commenterEmail)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create test fanfic by author
			fanfic, err := createTestFanfic(db, author.ID, fanficTitle)
			if err != nil {
				return true // Skip if fanfic creation fails
			}

			// Create comment by commenter
			comment, err := commentService.CreateComment(commenter.ID, fanfic.ID, nil, content)
			if err != nil {
				// Skip if content validation fails
				return true
			}

			// Fanfic owner should be able to delete comment on their fanfic
			err = commentService.DeleteComment(comment.ID, author.ID, fanfic.AuthorID)
			if err != nil {
				t.Logf("Fanfic owner should be able to delete comment on their fanfic, got error: %v", err)
				return false
			}

			// Verify comment is deleted
			_, err = commentService.GetComment(comment.ID)
			if err != ErrCommentNotFound {
				t.Logf("Comment should be deleted, got error: %v", err)
				return false
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidUsername(),
		genValidEmail(),
		genValidTitle(),
		genValidContent(),
	))

	// Test that unauthorized users cannot delete comments
	properties.Property("unauthorized users cannot delete comments", prop.ForAll(
		func(authorUsername, authorEmail, commenterUsername, commenterEmail, otherUsername, otherEmail, fanficTitle, content string) bool {
			// Ensure all different users
			if authorEmail == commenterEmail || authorEmail == otherEmail || commenterEmail == otherEmail {
				return true // Skip if not all different users
			}

			// Setup fresh database for each test
			db := setupTestDB(t)
			commentService := NewCommentService(db)

			// Create fanfic author
			author, err := createTestUser(db, authorUsername, authorEmail)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create commenter
			commenter, err := createTestUser(db, commenterUsername, commenterEmail)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create other user (unauthorized)
			otherUser, err := createTestUser(db, otherUsername, otherEmail)
			if err != nil {
				return true // Skip if user creation fails
			}

			// Create test fanfic by author
			fanfic, err := createTestFanfic(db, author.ID, fanficTitle)
			if err != nil {
				return true // Skip if fanfic creation fails
			}

			// Create comment by commenter
			comment, err := commentService.CreateComment(commenter.ID, fanfic.ID, nil, content)
			if err != nil {
				// Skip if content validation fails
				return true
			}

			// Other user should NOT be able to delete the comment
			err = commentService.DeleteComment(comment.ID, otherUser.ID, fanfic.AuthorID)
			if err == nil {
				t.Logf("Unauthorized user should not be able to delete comment")
				return false
			}

			// Verify error is ErrUnauthorized
			if err != ErrUnauthorized {
				t.Logf("Expected ErrUnauthorized, got: %v", err)
				return false
			}

			// Verify comment still exists
			retrievedComment, err := commentService.GetComment(comment.ID)
			if err != nil {
				t.Logf("Comment should still exist after unauthorized delete attempt, got error: %v", err)
				return false
			}

			if retrievedComment.ID != comment.ID {
				t.Logf("Retrieved comment ID mismatch")
				return false
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidUsername(),
		genValidEmail(),
		genValidUsername(),
		genValidEmail(),
		genValidTitle(),
		genValidContent(),
	))

	properties.TestingRun(t)
}
