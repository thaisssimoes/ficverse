package interactive

import (
	"errors"

	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrQuestionNotFound       = errors.New("question not found")
	ErrAnswerNotFound         = errors.New("answer not found")
	ErrPendingQuestionNotFound = errors.New("pending question not found")
)

// InteractiveRepository handles database operations for interactive mode
type InteractiveRepository struct {
	db *gorm.DB
}

// NewInteractiveRepository creates a new interactive repository
func NewInteractiveRepository(db *gorm.DB) *InteractiveRepository {
	return &InteractiveRepository{db: db}
}

// Question operations

func (r *InteractiveRepository) CreateQuestion(question *models.Question) error {
	return r.db.Create(question).Error
}

func (r *InteractiveRepository) GetQuestionByID(id int) (*models.Question, error) {
	var question models.Question
	err := r.db.First(&question, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrQuestionNotFound
		}
		return nil, err
	}
	return &question, nil
}

func (r *InteractiveRepository) GetQuestionByIDWithFanfic(id int) (*models.Question, error) {
	var question models.Question
	err := r.db.Preload("Fanfic").First(&question, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrQuestionNotFound
		}
		return nil, err
	}
	return &question, nil
}

func (r *InteractiveRepository) GetQuestionsByFanficID(fanficID int) ([]models.Question, error) {
	var questions []models.Question
	err := r.db.Where("fanfic_id = ?", fanficID).Order("created_at ASC").Find(&questions).Error
	return questions, err
}

func (r *InteractiveRepository) UpdateQuestion(question *models.Question) error {
	return r.db.Save(question).Error
}

func (r *InteractiveRepository) DeleteQuestion(id int) error {
	return r.db.Delete(&models.Question{}, id).Error
}

// Answer operations

func (r *InteractiveRepository) CreateAnswer(answer *models.Answer) error {
	return r.db.Create(answer).Error
}

func (r *InteractiveRepository) GetAnswerByUserFanficPlaceholder(userID, fanficID int, placeholder string) (*models.Answer, error) {
	var answer models.Answer
	err := r.db.Where("user_id = ? AND fanfic_id = ? AND placeholder = ?", userID, fanficID, placeholder).First(&answer).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAnswerNotFound
		}
		return nil, err
	}
	return &answer, nil
}

func (r *InteractiveRepository) GetAnswersByUserAndFanfic(userID, fanficID int) ([]models.Answer, error) {
	var answers []models.Answer
	err := r.db.Where("user_id = ? AND fanfic_id = ?", userID, fanficID).Find(&answers).Error
	return answers, err
}

func (r *InteractiveRepository) UpdateAnswer(answer *models.Answer) error {
	return r.db.Save(answer).Error
}

func (r *InteractiveRepository) DeleteAnswersByFanficID(fanficID int) error {
	return r.db.Where("fanfic_id = ?", fanficID).Delete(&models.Answer{}).Error
}

// PendingQuestion operations

func (r *InteractiveRepository) CreatePendingQuestion(pending *models.PendingQuestion) error {
	return r.db.Create(pending).Error
}

func (r *InteractiveRepository) GetPendingQuestionsByUserAndFanfic(userID, fanficID int) ([]models.PendingQuestion, error) {
	var pending []models.PendingQuestion
	err := r.db.Where("user_id = ? AND fanfic_id = ?", userID, fanficID).
		Preload("Question").
		Find(&pending).Error
	return pending, err
}

func (r *InteractiveRepository) DeletePendingQuestion(userID, fanficID, questionID int) error {
	return r.db.Where("user_id = ? AND fanfic_id = ? AND question_id = ?", userID, fanficID, questionID).
		Delete(&models.PendingQuestion{}).Error
}

func (r *InteractiveRepository) DeleteAllPendingQuestions(userID, fanficID int) error {
	return r.db.Where("user_id = ? AND fanfic_id = ?", userID, fanficID).
		Delete(&models.PendingQuestion{}).Error
}

// Get all users who have answers for a fanfic
func (r *InteractiveRepository) GetUsersWithAnswers(fanficID int) ([]int, error) {
	var userIDs []int
	err := r.db.Model(&models.Answer{}).
		Where("fanfic_id = ?", fanficID).
		Distinct("user_id").
		Pluck("user_id", &userIDs).Error
	return userIDs, err
}
