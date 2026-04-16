package routes

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/fanfic"
	"github.com/interactive-fanfic-platform/interactive"
	"gorm.io/gorm"
)

// InteractiveHandler handles interactive mode endpoints
type InteractiveHandler struct {
	service       *interactive.InteractiveService
	fanficService *fanfic.FanficService
}

// NewInteractiveHandler creates a new interactive handler
func NewInteractiveHandler(db *gorm.DB) *InteractiveHandler {
	return &InteractiveHandler{
		service:       interactive.NewInteractiveService(db),
		fanficService: fanfic.NewFanficService(db),
	}
}

// CreateQuestionRequest represents question creation request
type CreateQuestionRequest struct {
	QuestionText  string `json:"question_text" binding:"required"`
	Placeholder   string `json:"placeholder" binding:"required"`
	VariableType  string `json:"variable_type"`   // "standard" or "custom"
	StandardKey   string `json:"standard_key"`    // only when variable_type == "standard"
	DefaultAnswer string `json:"default_answer"`  // resposta padrão para modo normal
}

// UpdateQuestionRequest represents question update request
type UpdateQuestionRequest struct {
	QuestionText  string `json:"question_text"`
	DefaultAnswer string `json:"default_answer"`
}

// SaveAnswersRequest represents answers save request
type SaveAnswersRequest struct {
	Answers map[string]string `json:"answers" binding:"required"`
}

// UpdateAnswersRequest represents answers update request
type UpdateAnswersRequest struct {
	Answers map[string]string `json:"answers" binding:"required"`
}

// PendingQuestionsResponse represents pending questions response
type PendingQuestionsResponse struct {
	HasPending bool          `json:"has_pending"`
	Questions  []interface{} `json:"questions"`
}

// ListQuestions lists all questions for a fanfic
func (h *InteractiveHandler) ListQuestions(c *gin.Context) {
	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	questions, err := h.service.ListQuestions(fanficID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve questions",
			},
		})
		return
	}

	c.JSON(http.StatusOK, questions)
}

// CreateQuestion creates a new question
func (h *InteractiveHandler) CreateQuestion(c *gin.Context) {
	// Get authenticated user
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
		return
	}

	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	// Verify user owns the fanfic
	fanficData, err := h.fanficService.GetFanfic(fanficID)
	if err != nil {
		if errors.Is(err, fanfic.ErrFanficNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error: ErrorDetail{
					Code:    "NOT_FOUND",
					Message: "Fanfic not found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to verify fanfic ownership",
			},
		})
		return
	}

	if fanficData.AuthorID != user.ID {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error: ErrorDetail{
				Code:    "FORBIDDEN",
				Message: "You don't have permission to add questions to this fanfic",
			},
		})
		return
	}

	var req CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid input data",
				Details: []FieldError{
					{Field: "body", Message: err.Error()},
				},
			},
		})
		return
	}

	// Create question
	question, err := h.service.CreateQuestion(fanficID, req.QuestionText, req.Placeholder, req.VariableType, req.StandardKey, req.DefaultAnswer)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "CREATION_ERROR"

		if errors.Is(err, interactive.ErrQuestionTextRequired) {
			code = "QUESTION_TEXT_REQUIRED"
		} else if errors.Is(err, interactive.ErrPlaceholderRequired) {
			code = "PLACEHOLDER_REQUIRED"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, question)
}

// UpdateQuestion updates a question
func (h *InteractiveHandler) UpdateQuestion(c *gin.Context) {
	// Get authenticated user
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
		return
	}

	questionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid question ID",
			},
		})
		return
	}

	var req UpdateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid input data",
				Details: []FieldError{
					{Field: "body", Message: err.Error()},
				},
			},
		})
		return
	}

	// Update question with authorization check
	question, err := h.service.UpdateQuestion(questionID, user.ID, req.QuestionText, req.DefaultAnswer)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "UPDATE_ERROR"

		if errors.Is(err, interactive.ErrQuestionNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		} else if errors.Is(err, interactive.ErrUnauthorized) {
			statusCode = http.StatusForbidden
			code = "FORBIDDEN"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, question)
}

// DeleteQuestion deletes a question
func (h *InteractiveHandler) DeleteQuestion(c *gin.Context) {
	// Get authenticated user
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
		return
	}

	questionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid question ID",
			},
		})
		return
	}

	// Delete question with authorization check
	err = h.service.DeleteQuestion(questionID, user.ID)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "DELETE_ERROR"

		if errors.Is(err, interactive.ErrQuestionNotFound) {
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		} else if errors.Is(err, interactive.ErrUnauthorized) {
			statusCode = http.StatusForbidden
			code = "FORBIDDEN"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetAnswers retrieves user's answers for a fanfic
func (h *InteractiveHandler) GetAnswers(c *gin.Context) {
	// Get authenticated user
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
		return
	}

	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	answers, err := h.service.GetAnswers(user.ID, fanficID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve answers",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"answers": answers})
}

// SaveAnswers saves user's answers for a fanfic
func (h *InteractiveHandler) SaveAnswers(c *gin.Context) {
	// Get authenticated user
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
		return
	}

	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	var req SaveAnswersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid input data",
				Details: []FieldError{
					{Field: "body", Message: err.Error()},
				},
			},
		})
		return
	}

	err = h.service.SaveAnswers(user.ID, fanficID, req.Answers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "SAVE_ERROR",
				Message: "Failed to save answers",
			},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Answers saved successfully"})
}

// UpdateAnswers updates user's answers for a fanfic
func (h *InteractiveHandler) UpdateAnswers(c *gin.Context) {
	// Get authenticated user
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
		return
	}

	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	var req UpdateAnswersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid input data",
				Details: []FieldError{
					{Field: "body", Message: err.Error()},
				},
			},
		})
		return
	}

	err = h.service.SaveAnswers(user.ID, fanficID, req.Answers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UPDATE_ERROR",
				Message: "Failed to update answers",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Answers updated successfully"})
}

// RenderRequest is the body for the stateless render endpoint.
type RenderRequest struct {
	Content string            `json:"content" binding:"required"`
	Vars    map[string]string `json:"vars"`
}

// Render aplica o motor de renderização de tags de forma stateless.
// Não requer autenticação — é uma transformação pura de texto.
// POST /api/interactive/render
func (h *InteractiveHandler) Render(c *gin.Context) {
	var req RenderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Campo 'content' é obrigatório",
			},
		})
		return
	}

	vars := req.Vars
	if vars == nil {
		vars = map[string]string{}
	}

	rendered := interactive.RenderContent(req.Content, vars)
	c.JSON(http.StatusOK, gin.H{"rendered_html": rendered})
}

// GetPendingQuestions checks for pending questions
func (h *InteractiveHandler) GetPendingQuestions(c *gin.Context) {
	// Get authenticated user
	user, exists := auth.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
		return
	}

	fanficID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INVALID_ID",
				Message: "Invalid fanfic ID",
			},
		})
		return
	}

	hasPending, questions, err := h.service.HasPendingQuestions(user.ID, fanficID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to check pending questions",
			},
		})
		return
	}

	// Convert questions to interface slice
	questionList := make([]interface{}, len(questions))
	for i, q := range questions {
		questionList[i] = q
	}

	c.JSON(http.StatusOK, PendingQuestionsResponse{
		HasPending: hasPending,
		Questions:  questionList,
	})
}

