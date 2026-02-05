package interactive

import (
	"testing"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Helper function to setup test database
func setupTestDBForUnit(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Auto-migrate all models
	if err := db.AutoMigrate(
		&models.User{},
		&models.Fanfic{},
		&models.Chapter{},
		&models.Question{},
		&models.Answer{},
		&models.Comment{},
		&models.PendingQuestion{},
	); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

// Helper function to create a test fanfic
func createTestFanficForUnit(t *testing.T, db *gorm.DB, authorID int) *models.Fanfic {
	fanfic := &models.Fanfic{
		AuthorID:        authorID,
		Title:           "Test Fanfic",
		Synopsis:        "Test Synopsis",
		Disclaimer:      "Test Disclaimer",
		Category:        "Test Category",
		CoverURL:        "test.jpg",
		InteractiveMode: true,
	}
	if err := db.Create(fanfic).Error; err != nil {
		t.Fatalf("Failed to create test fanfic: %v", err)
	}
	return fanfic
}

// Helper function to create a test user
func createTestUserForUnit(t *testing.T, db *gorm.DB, email string) *models.User {
	user := &models.User{
		Username:     "testuser_" + email,
		Email:        email,
		PasswordHash: "hashedpassword",
	}
	if err := db.Create(user).Error; err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}
	return user
}

func TestCreateQuestion(t *testing.T) {
	db := setupTestDBForUnit(t)

	service := NewInteractiveService(db)

	// Create test user and fanfic
	user := createTestUserForUnit(t, db, "test@example.com")
	fanfic := createTestFanficForUnit(t, db, user.ID)

	tests := []struct {
		name          string
		fanficID      int
		questionText  string
		placeholder   string
		expectError   bool
		expectedError error
	}{
		{
			name:         "Valid question",
			fanficID:     fanfic.ID,
			questionText: "What is your name?",
			placeholder:  "name",
			expectError:  false,
		},
		{
			name:          "Empty question text",
			fanficID:      fanfic.ID,
			questionText:  "",
			placeholder:   "name",
			expectError:   true,
			expectedError: ErrQuestionTextRequired,
		},
		{
			name:          "Empty placeholder",
			fanficID:      fanfic.ID,
			questionText:  "What is your name?",
			placeholder:   "",
			expectError:   true,
			expectedError: ErrPlaceholderRequired,
		},
		{
			name:          "Invalid fanfic ID",
			fanficID:      0,
			questionText:  "What is your name?",
			placeholder:   "name",
			expectError:   true,
			expectedError: ErrInvalidFanfic,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			question, err := service.CreateQuestion(tt.fanficID, tt.questionText, tt.placeholder)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
				if tt.expectedError != nil && err != tt.expectedError {
					t.Errorf("Expected error %v, got %v", tt.expectedError, err)
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if question == nil {
					t.Errorf("Expected question but got nil")
				}
				if question.QuestionText != tt.questionText {
					t.Errorf("Expected question text %s, got %s", tt.questionText, question.QuestionText)
				}
				if question.Placeholder != tt.placeholder {
					t.Errorf("Expected placeholder %s, got %s", tt.placeholder, question.Placeholder)
				}
			}
		})
	}
}

func TestSaveAndGetAnswers(t *testing.T) {
	db := setupTestDBForUnit(t)

	service := NewInteractiveService(db)

	// Create test users and fanfic
	author := createTestUserForUnit(t, db, "author@example.com")
	reader := createTestUserForUnit(t, db, "reader@example.com")
	fanfic := createTestFanficForUnit(t, db, author.ID)

	// Create questions
	_, err := service.CreateQuestion(fanfic.ID, "What is your name?", "name")
	if err != nil {
		t.Fatalf("Failed to create question: %v", err)
	}
	_, err = service.CreateQuestion(fanfic.ID, "What is your favorite color?", "color")
	if err != nil {
		t.Fatalf("Failed to create question: %v", err)
	}

	// Save answers
	answers := map[string]string{
		"name":  "Alice",
		"color": "Blue",
	}
	err = service.SaveAnswers(reader.ID, fanfic.ID, answers)
	if err != nil {
		t.Fatalf("Failed to save answers: %v", err)
	}

	// Get answers
	retrievedAnswers, err := service.GetAnswers(reader.ID, fanfic.ID)
	if err != nil {
		t.Fatalf("Failed to get answers: %v", err)
	}

	// Verify answers
	if len(retrievedAnswers) != len(answers) {
		t.Errorf("Expected %d answers, got %d", len(answers), len(retrievedAnswers))
	}
	for placeholder, answer := range answers {
		if retrievedAnswers[placeholder] != answer {
			t.Errorf("Expected answer %s for placeholder %s, got %s", answer, placeholder, retrievedAnswers[placeholder])
		}
	}
}

func TestUpdateAnswer(t *testing.T) {
	db := setupTestDBForUnit(t)

	service := NewInteractiveService(db)

	// Create test users and fanfic
	author := createTestUserForUnit(t, db, "author@example.com")
	reader := createTestUserForUnit(t, db, "reader@example.com")
	fanfic := createTestFanficForUnit(t, db, author.ID)

	// Create question
	_, err := service.CreateQuestion(fanfic.ID, "What is your name?", "name")
	if err != nil {
		t.Fatalf("Failed to create question: %v", err)
	}

	// Save initial answer
	answers := map[string]string{
		"name": "Alice",
	}
	err = service.SaveAnswers(reader.ID, fanfic.ID, answers)
	if err != nil {
		t.Fatalf("Failed to save answers: %v", err)
	}

	// Update answer
	err = service.UpdateAnswer(reader.ID, fanfic.ID, "name", "Bob")
	if err != nil {
		t.Fatalf("Failed to update answer: %v", err)
	}

	// Get updated answer
	retrievedAnswers, err := service.GetAnswers(reader.ID, fanfic.ID)
	if err != nil {
		t.Fatalf("Failed to get answers: %v", err)
	}

	if retrievedAnswers["name"] != "Bob" {
		t.Errorf("Expected updated answer 'Bob', got '%s'", retrievedAnswers["name"])
	}
}

func TestSubstitutePlaceholders(t *testing.T) {
	db := setupTestDBForUnit(t)

	service := NewInteractiveService(db)

	tests := []struct {
		name     string
		content  string
		answers  map[string]string
		expected string
	}{
		{
			name:    "Single placeholder",
			content: "Hello, {{name}}!",
			answers: map[string]string{
				"name": "Alice",
			},
			expected: "Hello, Alice!",
		},
		{
			name:    "Multiple placeholders",
			content: "Hello, {{name}}! Your favorite color is {{color}}.",
			answers: map[string]string{
				"name":  "Alice",
				"color": "blue",
			},
			expected: "Hello, Alice! Your favorite color is blue.",
		},
		{
			name:    "No placeholders",
			content: "Hello, world!",
			answers: map[string]string{
				"name": "Alice",
			},
			expected: "Hello, world!",
		},
		{
			name:     "Empty answers",
			content:  "Hello, {{name}}!",
			answers:  map[string]string{},
			expected: "Hello, {{name}}!",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.SubstitutePlaceholders(tt.content, tt.answers)
			if result != tt.expected {
				t.Errorf("Expected '%s', got '%s'", tt.expected, result)
			}
		})
	}
}

func TestHasPendingQuestions(t *testing.T) {
	db := setupTestDBForUnit(t)

	service := NewInteractiveService(db)

	// Create test users and fanfic
	author := createTestUserForUnit(t, db, "author@example.com")
	reader := createTestUserForUnit(t, db, "reader@example.com")
	fanfic := createTestFanficForUnit(t, db, author.ID)

	// Create initial question
	_, err := service.CreateQuestion(fanfic.ID, "What is your name?", "name")
	if err != nil {
		t.Fatalf("Failed to create question: %v", err)
	}

	// Reader answers the question
	answers := map[string]string{
		"name": "Alice",
	}
	err = service.SaveAnswers(reader.ID, fanfic.ID, answers)
	if err != nil {
		t.Fatalf("Failed to save answers: %v", err)
	}

	// Check for pending questions (should be none)
	hasPending, _, err := service.HasPendingQuestions(reader.ID, fanfic.ID)
	if err != nil {
		t.Fatalf("Failed to check pending questions: %v", err)
	}
	if hasPending {
		t.Errorf("Expected no pending questions, but found some")
	}

	// Add new question
	newQuestion, err := service.CreateQuestion(fanfic.ID, "What is your favorite color?", "color")
	if err != nil {
		t.Fatalf("Failed to create new question: %v", err)
	}

	// Check for pending questions (should have one)
	hasPending, pendingQuestions, err := service.HasPendingQuestions(reader.ID, fanfic.ID)
	if err != nil {
		t.Fatalf("Failed to check pending questions: %v", err)
	}
	if !hasPending {
		t.Errorf("Expected pending questions, but found none")
	}
	if len(pendingQuestions) != 1 {
		t.Errorf("Expected 1 pending question, got %d", len(pendingQuestions))
	}
	if pendingQuestions[0].ID != newQuestion.ID {
		t.Errorf("Expected pending question ID %d, got %d", newQuestion.ID, pendingQuestions[0].ID)
	}
}

func TestDeleteQuestion(t *testing.T) {
	db := setupTestDBForUnit(t)

	service := NewInteractiveService(db)

	// Create test user and fanfic
	user := createTestUserForUnit(t, db, "test@example.com")
	fanfic := createTestFanficForUnit(t, db, user.ID)

	// Create question
	question, err := service.CreateQuestion(fanfic.ID, "What is your name?", "name")
	if err != nil {
		t.Fatalf("Failed to create question: %v", err)
	}

	// Delete question with authorization
	err = service.DeleteQuestion(question.ID, user.ID)
	if err != nil {
		t.Fatalf("Failed to delete question: %v", err)
	}

	// Verify question is deleted
	_, err = service.repo.GetQuestionByID(question.ID)
	if err != ErrQuestionNotFound {
		t.Errorf("Expected ErrQuestionNotFound, got %v", err)
	}
}
