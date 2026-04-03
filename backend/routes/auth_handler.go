package routes

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
)

// contains checks if a string contains a substring
func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService *auth.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *auth.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// RegisterRequest represents registration request body
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginRequest represents login request body
type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Log the error for debugging
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

	user, err := h.authService.Register(req.Username, req.Email, req.Password)
	if err != nil {
		statusCode := http.StatusBadRequest
		code := "REGISTRATION_ERROR"
		message := err.Error()
		
		if errors.Is(err, auth.ErrInvalidEmail) {
			code = "INVALID_EMAIL"
			message = "Email inválido"
		} else if errors.Is(err, auth.ErrPasswordTooShort) {
			code = "PASSWORD_TOO_SHORT"
			message = "Senha muito curta (mínimo 6 caracteres)"
		} else if errors.Is(err, auth.ErrUsernameRequired) {
			code = "USERNAME_REQUIRED"
			message = "Nome de usuário é obrigatório"
		} else if err.Error() == "email already exists" {
			statusCode = http.StatusConflict
			code = "DUPLICATE_EMAIL"
			message = "Este email já está cadastrado"
		} else if err.Error() == "username already exists" {
			statusCode = http.StatusConflict
			code = "DUPLICATE_USERNAME"
			message = "Este nome de usuário já está em uso"
		} else if contains(err.Error(), "duplicate key") && contains(err.Error(), "username") {
			statusCode = http.StatusConflict
			code = "DUPLICATE_USERNAME"
			message = "Este nome de usuário já está em uso"
		} else if contains(err.Error(), "duplicate key") && contains(err.Error(), "email") {
			statusCode = http.StatusConflict
			code = "DUPLICATE_EMAIL"
			message = "Este email já está cadastrado"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: message,
			},
		})
		return
	}

	// Generate token for the new user
	token, _, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "TOKEN_GENERATION_ERROR",
				Message: "Failed to generate authentication token",
			},
		})
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  user,
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
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

	token, user, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		statusCode := http.StatusUnauthorized
		code := "INVALID_CREDENTIALS"
		
		if errors.Is(err, auth.ErrInvalidCredentials) {
			code = "INVALID_CREDENTIALS"
		}

		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    code,
				Message: "Invalid email or password",
			},
		})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User:  user,
	})
}

// ForgotPasswordRequest represents forgot password request body
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required"`
}

// ResetPasswordRequest represents reset password request body
type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// ForgotPassword handles password recovery requests
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Email é obrigatório",
			},
		})
		return
	}

	// Always return success to prevent user enumeration
	_ = h.authService.ForgotPassword(req.Email)

	c.JSON(http.StatusOK, gin.H{
		"message": "Se este email estiver cadastrado, você receberá as instruções em breve.",
	})
}

// ResetPassword handles password reset with token
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: "Token e nova senha são obrigatórios",
			},
		})
		return
	}

	if err := h.authService.ResetPassword(req.Token, req.Password); err != nil {
		statusCode := http.StatusBadRequest
		message := err.Error()
		c.JSON(statusCode, ErrorResponse{
			Error: ErrorDetail{
				Code:    "RESET_ERROR",
				Message: message,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Senha redefinida com sucesso.",
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// Get token from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authorization header required",
			},
		})
		return
	}

	// Extract token
	token := ""
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token = authHeader[7:]
	}

	if token == "" {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Invalid authorization header format",
			},
		})
		return
	}

	// Logout
	if err := h.authService.Logout(token); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "LOGOUT_ERROR",
				Message: "Failed to logout",
			},
		})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
