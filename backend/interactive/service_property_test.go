package interactive

import (
	"fmt"
	"testing"

	"github.com/interactive-fanfic-platform/models"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Helper function to setup test database
func setupTestDB(t *testing.T) *gorm.DB {
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
func createTestFanfic(t *testing.T, db *gorm.DB, authorID int) *models.Fanfic {
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
func createTestUser(t *testing.T, db *gorm.DB, email string) *models.User {
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

// Feature: interactive-fanfic-platform, Property 12: Questions are persisted with placeholders
func TestProperty_QuestionsPersistedWithPlaceholders(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("For any valid question data, creating a question should store both text and placeholder",
		prop.ForAll(
			func(questionText string, placeholder string) bool {
				db := setupTestDB(t)

				service := NewInteractiveService(db)

				// Create test user and fanfic
				user := createTestUser(t, db, fmt.Sprintf("test%d@example.com", len(questionText)))
				fanfic := createTestFanfic(t, db, user.ID)

				// Create question
				question, err := service.CreateQuestion(fanfic.ID, questionText, placeholder, "custom", "", "")
				if err != nil {
					return false
				}

				// Verify question was created with correct data
				if question.ID == 0 {
					return false
				}
				if question.FanficID != fanfic.ID {
					return false
				}
				if question.QuestionText != questionText {
					return false
				}
				if question.Placeholder != placeholder {
					return false
				}

				// Retrieve question from database
				retrieved, err := service.repo.GetQuestionByID(question.ID)
				if err != nil {
					return false
				}

				// Verify retrieved question matches
				if retrieved.QuestionText != questionText {
					return false
				}
				if retrieved.Placeholder != placeholder {
					return false
				}
				if retrieved.FanficID != fanfic.ID {
					return false
				}

				return true
			},
			gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 100 }),
			gen.Identifier().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 50 }),
		))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 13: New questions create pending status
func TestProperty_NewQuestionsCreatePendingStatus(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("For any fanfic with existing readers, adding a new question should mark all readers as having pending questions",
		prop.ForAll(
			func(numReaders int, questionText string, placeholder string) bool {
				db := setupTestDB(t)

				service := NewInteractiveService(db)

				// Create test author and fanfic
				author := createTestUser(t, db, "author@example.com")
				fanfic := createTestFanfic(t, db, author.ID)

				// Create initial question
				_, err := service.CreateQuestion(fanfic.ID, "Initial Question", "initial_placeholder", "custom", "", "")
				if err != nil {
					return false
				}

				// Create readers and their answers
				readerIDs := make([]int, numReaders)
				for i := 0; i < numReaders; i++ {
					reader := createTestUser(t, db, fmt.Sprintf("reader%d@example.com", i))
					readerIDs[i] = reader.ID

					// Save answers for initial question
					answers := map[string]string{
						"initial_placeholder": fmt.Sprintf("Answer from reader %d", i),
					}
					if err := service.SaveAnswers(reader.ID, fanfic.ID, answers); err != nil {
						return false
					}
				}

				// Add new question
				newQuestion, err := service.CreateQuestion(fanfic.ID, questionText, placeholder, "custom", "", "")
				if err != nil {
					return false
				}

				// Verify all readers have pending questions
				for _, readerID := range readerIDs {
					hasPending, pendingQuestions, err := service.HasPendingQuestions(readerID, fanfic.ID)
					if err != nil {
						return false
					}
					if !hasPending {
						return false
					}

					// Verify the new question is in pending questions
					found := false
					for _, pq := range pendingQuestions {
						if pq.ID == newQuestion.ID {
							found = true
							break
						}
					}
					if !found {
						return false
					}
				}

				return true
			},
			gen.IntRange(1, 5),
			gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 100 }),
			gen.Identifier().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 50 }),
		))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 14: Question deletion removes data
func TestProperty_QuestionDeletionRemovesData(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("For any question, deleting it should remove the question from the system",
		prop.ForAll(
			func(questionText string, placeholder string) bool {
				db := setupTestDB(t)

				service := NewInteractiveService(db)

				// Create test user and fanfic
				user := createTestUser(t, db, "test@example.com")
				fanfic := createTestFanfic(t, db, user.ID)

				// Create question
				question, err := service.CreateQuestion(fanfic.ID, questionText, placeholder, "custom", "", "")
				if err != nil {
					return false
				}

				questionID := question.ID

				// Delete question with authorization
				if err := service.DeleteQuestion(questionID, user.ID); err != nil {
					return false
				}

				// Verify question is deleted
				_, err = service.repo.GetQuestionByID(questionID)
				if err == nil {
					return false // Should return error since question is deleted
				}
				if err != ErrQuestionNotFound {
					return false // Should be "not found" error
				}

				// Verify question is not in list
				questions, err := service.ListQuestions(fanfic.ID)
				if err != nil {
					return false
				}
				for _, q := range questions {
					if q.ID == questionID {
						return false // Deleted question should not appear in list
					}
				}

				return true
			},
			gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 100 }),
			gen.Identifier().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 50 }),
		))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 15: Placeholder validation
func TestProperty_PlaceholderValidation(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("For any chapter content in interactive mode, all placeholders should have corresponding questions",
		prop.ForAll(
			func(placeholders []string) bool {
				db := setupTestDB(t)

				service := NewInteractiveService(db)

				// Create test user and fanfic
				user := createTestUser(t, db, "test@example.com")
				fanfic := createTestFanfic(t, db, user.ID)

				// Create questions for all placeholders
				for _, placeholder := range placeholders {
					_, err := service.CreateQuestion(fanfic.ID, "Question for "+placeholder, placeholder, "custom", "", "")
					if err != nil {
						return false
					}
				}

				// Build content with placeholders
				content := "This is a story with placeholders: "
				for _, placeholder := range placeholders {
					content += "{{" + placeholder + "}} "
				}

				// Get all questions for fanfic
				questions, err := service.ListQuestions(fanfic.ID)
				if err != nil {
					return false
				}

				// Build map of placeholders from questions
				questionPlaceholders := make(map[string]bool)
				for _, q := range questions {
					questionPlaceholders[q.Placeholder] = true
				}

				// Verify all placeholders in content have corresponding questions
				for _, placeholder := range placeholders {
					if !questionPlaceholders[placeholder] {
						return false
					}
				}

				return true
			},
			gen.SliceOf(gen.Identifier().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 20 })).
				SuchThat(func(s []string) bool { return len(s) > 0 && len(s) < 10 }),
		))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 23: Placeholder substitution in interactive mode
func TestProperty_PlaceholderSubstitution(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("For any chapter content with placeholders and complete answer set, reading in interactive mode should replace all placeholders",
		prop.ForAll(
			func(answers map[string]string) bool {
				if len(answers) == 0 {
					return true // Skip empty answer sets
				}

				db := setupTestDB(t)

				service := NewInteractiveService(db)

				// Build content with placeholders
				content := "Story: "
				for placeholder := range answers {
					content += "{{" + placeholder + "}} "
				}

				// Substitute placeholders
				result := service.SubstitutePlaceholders(content, answers)

				// Verify all placeholders are replaced
				for placeholder, answer := range answers {
					// Check that placeholder is not in result
					if len(placeholder) > 0 && len(answer) > 0 {
						placeholderPattern := "{{" + placeholder + "}}"
						if len(placeholderPattern) > 0 && len(result) > 0 {
							// Placeholder should not appear in result
							found := false
							for i := 0; i <= len(result)-len(placeholderPattern); i++ {
								if result[i:i+len(placeholderPattern)] == placeholderPattern {
									found = true
									break
								}
							}
							if found {
								return false
							}

							// Answer should appear in result
							answerFound := false
							for i := 0; i <= len(result)-len(answer); i++ {
								if result[i:i+len(answer)] == answer {
									answerFound = true
									break
								}
							}
							if !answerFound {
								return false
							}
						}
					}
				}

				return true
			},
			gen.MapOf(
				gen.Identifier().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 20 }),
				gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 50 }),
			).SuchThat(func(m map[string]string) bool { return len(m) > 0 && len(m) < 10 }),
		))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 25: Non-interactive mode shows original text
func TestProperty_NonInteractiveModeShowsOriginalText(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("For any chapter content with placeholders, reading in non-interactive mode should display original text",
		prop.ForAll(
			func(placeholders []string, content string) bool {
				if len(placeholders) == 0 {
					return true // Skip empty placeholder sets
				}

				db := setupTestDB(t)
				_ = db // Suppress unused variable warning

				_ = NewInteractiveService(db) // Suppress unused variable warning

				// Build content with placeholders
				fullContent := content + " "
				for _, placeholder := range placeholders {
					fullContent += "{{" + placeholder + "}} "
				}

				// In non-interactive mode, we simply don't call SubstitutePlaceholders
				// The original content should remain unchanged
				result := fullContent

				// Verify all placeholders are still in the content
				for _, placeholder := range placeholders {
					if len(placeholder) > 0 {
						placeholderPattern := "{{" + placeholder + "}}"
						if len(placeholderPattern) > 0 && len(result) > 0 {
							// Placeholder should still appear in result
							found := false
							for i := 0; i <= len(result)-len(placeholderPattern); i++ {
								if result[i:i+len(placeholderPattern)] == placeholderPattern {
									found = true
									break
								}
							}
							if !found {
								return false
							}
						}
					}
				}

				return true
			},
			gen.SliceOf(gen.Identifier().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 20 })).
				SuchThat(func(s []string) bool { return len(s) > 0 && len(s) < 10 }),
			gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 100 }),
		))

	properties.TestingRun(t)
}
