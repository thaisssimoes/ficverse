package interactive

import (
	"errors"
	"strings"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrQuestionTextRequired = errors.New("question text is required")
	ErrPlaceholderRequired  = errors.New("placeholder is required")
	ErrAnswerTextRequired   = errors.New("answer text is required")
	ErrInvalidFanfic        = errors.New("invalid fanfic ID")
	ErrUnauthorized         = errors.New("unauthorized: user is not the fanfic author")
)

// InteractiveService handles business logic for interactive mode
type InteractiveService struct {
	repo *InteractiveRepository
	db   *gorm.DB
}

// NewInteractiveService creates a new interactive service
func NewInteractiveService(db *gorm.DB) *InteractiveService {
	return &InteractiveService{
		repo: NewInteractiveRepository(db),
		db:   db,
	}
}

// CreateQuestion creates a new question and marks existing readers as having pending questions
func (s *InteractiveService) CreateQuestion(fanficID int, questionText, placeholder, variableType, standardKey, defaultAnswer string) (*models.Question, error) {
	// Validate input
	if strings.TrimSpace(questionText) == "" {
		return nil, ErrQuestionTextRequired
	}
	if strings.TrimSpace(placeholder) == "" {
		return nil, ErrPlaceholderRequired
	}
	if fanficID <= 0 {
		return nil, ErrInvalidFanfic
	}
	if variableType == "" {
		variableType = "custom"
	}

	// Use transaction to ensure atomicity
	var question *models.Question
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Create question
		question = &models.Question{
			FanficID:      fanficID,
			QuestionText:  strings.TrimSpace(questionText),
			Placeholder:   strings.TrimSpace(placeholder),
			VariableType:  variableType,
			StandardKey:   standardKey,
			DefaultAnswer: strings.TrimSpace(defaultAnswer),
		}

		txRepo := NewInteractiveRepository(tx)
		if err := txRepo.CreateQuestion(question); err != nil {
			return err
		}

		// Get all users who have answers for this fanfic
		userIDs, err := txRepo.GetUsersWithAnswers(fanficID)
		if err != nil {
			return err
		}

		// Create pending questions for all users
		for _, userID := range userIDs {
			pending := &models.PendingQuestion{
				UserID:     userID,
				FanficID:   fanficID,
				QuestionID: question.ID,
			}
			if err := txRepo.CreatePendingQuestion(pending); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return question, nil
}

// UpdateQuestion updates a question
func (s *InteractiveService) UpdateQuestion(questionID int, authorID int, questionText, defaultAnswer string) (*models.Question, error) {
	// Get existing question with fanfic preloaded
	question, err := s.repo.GetQuestionByIDWithFanfic(questionID)
	if err != nil {
		return nil, err
	}

	// Check authorization - user must be the fanfic author
	if question.Fanfic.AuthorID != authorID {
		return nil, ErrUnauthorized
	}

	// Validate and update
	if questionText != "" {
		if strings.TrimSpace(questionText) == "" {
			return nil, ErrQuestionTextRequired
		}
		question.QuestionText = strings.TrimSpace(questionText)
	}
	question.DefaultAnswer = strings.TrimSpace(defaultAnswer)

	if err := s.repo.UpdateQuestion(question); err != nil {
		return nil, err
	}

	return question, nil
}

// DeleteQuestion deletes a question
func (s *InteractiveService) DeleteQuestion(questionID int, authorID int) error {
	// Get existing question with fanfic preloaded
	question, err := s.repo.GetQuestionByIDWithFanfic(questionID)
	if err != nil {
		return err
	}

	// Check authorization - user must be the fanfic author
	if question.Fanfic.AuthorID != authorID {
		return ErrUnauthorized
	}

	return s.repo.DeleteQuestion(questionID)
}

// ListQuestions retrieves all questions for a fanfic
func (s *InteractiveService) ListQuestions(fanficID int) ([]models.Question, error) {
	return s.repo.GetQuestionsByFanficID(fanficID)
}

// SaveAnswers saves a set of answers for a user and fanfic
func (s *InteractiveService) SaveAnswers(userID, fanficID int, answers map[string]string) error {
	if userID <= 0 || fanficID <= 0 {
		return errors.New("invalid user or fanfic ID")
	}

	// Use transaction to ensure atomicity
	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := NewInteractiveRepository(tx)

		for placeholder, answerText := range answers {
			if strings.TrimSpace(answerText) == "" {
				continue // Skip empty answers
			}

			// Check if answer already exists
			existingAnswer, err := txRepo.GetAnswerByUserFanficPlaceholder(userID, fanficID, placeholder)
			if err != nil && !errors.Is(err, ErrAnswerNotFound) {
				return err
			}

			if existingAnswer != nil {
				// Update existing answer
				existingAnswer.AnswerText = strings.TrimSpace(answerText)
				if err := txRepo.UpdateAnswer(existingAnswer); err != nil {
					return err
				}
			} else {
				// Create new answer
				answer := &models.Answer{
					UserID:      userID,
					FanficID:    fanficID,
					Placeholder: placeholder,
					AnswerText:  strings.TrimSpace(answerText),
				}
				if err := txRepo.CreateAnswer(answer); err != nil {
					return err
				}
			}
		}

		// Clear pending questions for this user and fanfic
		if err := txRepo.DeleteAllPendingQuestions(userID, fanficID); err != nil {
			return err
		}

		return nil
	})
}

// GetAnswers retrieves all answers for a user and fanfic
func (s *InteractiveService) GetAnswers(userID, fanficID int) (map[string]string, error) {
	answers, err := s.repo.GetAnswersByUserAndFanfic(userID, fanficID)
	if err != nil {
		return nil, err
	}

	// Convert to map
	answerMap := make(map[string]string)
	for _, answer := range answers {
		answerMap[answer.Placeholder] = answer.AnswerText
	}

	return answerMap, nil
}

// UpdateAnswer updates a single answer
func (s *InteractiveService) UpdateAnswer(userID, fanficID int, placeholder, answerText string) error {
	if strings.TrimSpace(answerText) == "" {
		return ErrAnswerTextRequired
	}

	// Get existing answer
	answer, err := s.repo.GetAnswerByUserFanficPlaceholder(userID, fanficID, placeholder)
	if err != nil {
		if errors.Is(err, ErrAnswerNotFound) {
			// Create new answer
			answer = &models.Answer{
				UserID:      userID,
				FanficID:    fanficID,
				Placeholder: placeholder,
				AnswerText:  strings.TrimSpace(answerText),
			}
			return s.repo.CreateAnswer(answer)
		}
		return err
	}

	// Update existing answer
	answer.AnswerText = strings.TrimSpace(answerText)
	return s.repo.UpdateAnswer(answer)
}

// SubstitutePlaceholders replaces placeholders in content with answers
func (s *InteractiveService) SubstitutePlaceholders(content string, answers map[string]string) string {
	result := content
	for placeholder, answer := range answers {
		// Replace {{placeholder}} with answer
		result = strings.ReplaceAll(result, "{{"+placeholder+"}}", answer)
	}
	return result
}

// HasPendingQuestions checks if a user has pending questions for a fanfic
func (s *InteractiveService) HasPendingQuestions(userID, fanficID int) (bool, []models.Question, error) {
	pending, err := s.repo.GetPendingQuestionsByUserAndFanfic(userID, fanficID)
	if err != nil {
		return false, nil, err
	}

	if len(pending) == 0 {
		return false, nil, nil
	}

	// Extract questions
	questions := make([]models.Question, len(pending))
	for i, p := range pending {
		questions[i] = p.Question
	}

	return true, questions, nil
}
