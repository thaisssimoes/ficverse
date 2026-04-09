package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token expired")
	ErrInvalidEmail       = errors.New("invalid email format")
	ErrPasswordTooShort   = errors.New("password must be at least 8 characters")
	ErrUsernameRequired   = errors.New("username is required")
)

// Claims represents JWT token claims
type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

// AuthService handles authentication operations
type AuthService struct {
	repo           *UserRepository
	jwtSecret      []byte
	tokenDuration  time.Duration
	invalidTokens  map[string]bool
	invalidTokenMu sync.RWMutex
	email          *EmailService
	frontendURL    string
}

// NewAuthService creates a new authentication service
func NewAuthService(db *gorm.DB, jwtSecret string, email *EmailService, frontendURL string) *AuthService {
	return &AuthService{
		repo:           NewUserRepository(db),
		jwtSecret:      []byte(jwtSecret),
		tokenDuration:  24 * time.Hour,
		invalidTokens:  make(map[string]bool),
		invalidTokenMu: sync.RWMutex{},
		email:          email,
		frontendURL:    frontendURL,
	}
}

// Register creates a new user account
func (s *AuthService) Register(username, email, password string) (*models.User, error) {
	// Validate input
	if err := s.validateRegistration(username, email, password); err != nil {
		return nil, err
	}

	// Create user
	user, err := s.repo.Create(username, email, password)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// Login authenticates a user and returns a JWT token
func (s *AuthService) Login(email, password string) (string, *models.User, error) {
	// Get user by email
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return "", nil, ErrInvalidCredentials
		}
		return "", nil, err
	}

	// Verify password
	if !s.repo.VerifyPassword(user, password) {
		return "", nil, ErrInvalidCredentials
	}

	// Generate JWT token
	token, err := s.generateToken(user)
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return token, user, nil
}

// ValidateToken validates a JWT token and returns the user
func (s *AuthService) ValidateToken(tokenString string) (*models.User, error) {
	// Check if token is in invalidated list
	s.invalidTokenMu.RLock()
	if s.invalidTokens[tokenString] {
		s.invalidTokenMu.RUnlock()
		return nil, ErrInvalidToken
	}
	s.invalidTokenMu.RUnlock()

	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	// Extract claims
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// Get user from database
	user, err := s.repo.GetByID(claims.UserID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// Logout invalidates a token
func (s *AuthService) Logout(tokenString string) error {
	// Add token to invalidated list
	s.invalidTokenMu.Lock()
	s.invalidTokens[tokenString] = true
	s.invalidTokenMu.Unlock()

	return nil
}

// ForgotPassword generates a reset token and sends a recovery email.
// Always returns nil to prevent user enumeration.
func (s *AuthService) ForgotPassword(email string) error {
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		// Don't reveal if email exists
		return nil
	}

	// Generate a secure random token
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}
	rawToken := hex.EncodeToString(rawBytes)

	// Store hashed version
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])
	expiresAt := time.Now().Add(1 * time.Hour)

	if err := s.repo.CreateResetToken(user.ID, tokenHash, expiresAt); err != nil {
		return fmt.Errorf("failed to store reset token: %w", err)
	}

	if s.email != nil && s.email.IsConfigured() {
		resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.frontendURL, rawToken)
		if err := s.email.SendPasswordReset(user.Email, user.Username, resetURL); err != nil {
			return fmt.Errorf("failed to send email: %w", err)
		}
	}

	return nil
}

// ResetPassword validates the token and updates the user's password
func (s *AuthService) ResetPassword(rawToken, newPassword string) error {
	if len(newPassword) < 8 {
		return ErrPasswordTooShort
	}

	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	resetToken, err := s.repo.GetValidResetToken(tokenHash)
	if err != nil {
		return err
	}

	if err := s.repo.UpdatePassword(resetToken.UserID, newPassword); err != nil {
		return err
	}

	return s.repo.MarkResetTokenUsed(resetToken.ID)
}

// generateToken creates a JWT token for a user
func (s *AuthService) generateToken(user *models.User) (string, error) {
	expirationTime := time.Now().Add(s.tokenDuration)

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// validateRegistration validates registration input
func (s *AuthService) validateRegistration(username, email, password string) error {
	if username == "" {
		return ErrUsernameRequired
	}

	if email == "" || !isValidEmail(email) {
		return ErrInvalidEmail
	}

	if len(password) < 8 {
		return ErrPasswordTooShort
	}

	return nil
}

// isValidEmail performs basic email validation
func isValidEmail(email string) bool {
	// Basic email validation - contains @ and at least one dot after @
	atIndex := -1
	for i, c := range email {
		if c == '@' {
			if atIndex != -1 {
				return false // Multiple @ symbols
			}
			atIndex = i
		}
	}

	if atIndex == -1 || atIndex == 0 || atIndex == len(email)-1 {
		return false
	}

	// Check for dot after @
	for i := atIndex + 1; i < len(email); i++ {
		if email[i] == '.' && i < len(email)-1 {
			return true
		}
	}

	return false
}
