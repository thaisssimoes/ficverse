package auth

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/interactive-fanfic-platform/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrDuplicateEmail    = errors.New("email already exists")
	ErrDuplicateUsername = errors.New("username already exists")
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user with hashed password
func (r *UserRepository) Create(username, email, password string) (*models.User, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
	}

	result := r.db.Create(user)
	if result.Error != nil {
		// Check for unique constraint violations
		errMsg := result.Error.Error()
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) || 
		   strings.Contains(errMsg, "UNIQUE constraint failed") {
			// Try to determine which field is duplicated
			if strings.Contains(errMsg, "users.email") {
				return nil, ErrDuplicateEmail
			}
			if strings.Contains(errMsg, "users.username") {
				return nil, ErrDuplicateUsername
			}
			// Default to email error if we can't determine
			return nil, ErrDuplicateEmail
		}
		return nil, fmt.Errorf("failed to create user: %w", result.Error)
	}

	return user, nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id int) (*models.User, error) {
	var user models.User
	result := r.db.First(&user, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user: %w", result.Error)
	}
	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	result := r.db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", result.Error)
	}
	return &user, nil
}

// GetByUsername retrieves a user by username
func (r *UserRepository) GetByUsername(username string) (*models.User, error) {
	var user models.User
	result := r.db.Where("username = ?", username).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by username: %w", result.Error)
	}
	return &user, nil
}

// Update updates user information
func (r *UserRepository) Update(user *models.User) error {
	result := r.db.Save(user)
	if result.Error != nil {
		return fmt.Errorf("failed to update user: %w", result.Error)
	}
	return nil
}

// Delete deletes a user by ID
func (r *UserRepository) Delete(id int) error {
	result := r.db.Delete(&models.User{}, id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete user: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

// VerifyPassword checks if the provided password matches the user's hashed password
func (r *UserRepository) VerifyPassword(user *models.User, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	return err == nil
}

// UpdatePassword sets a new hashed password for the user
func (r *UserRepository) UpdatePassword(userID int, newPassword string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	result := r.db.Model(&models.User{}).Where("id = ?", userID).Update("password_hash", string(hashedPassword))
	if result.Error != nil {
		return fmt.Errorf("failed to update password: %w", result.Error)
	}
	return nil
}

// CreateResetToken stores a hashed reset token for a user
func (r *UserRepository) CreateResetToken(userID int, tokenHash string, expiresAt time.Time) error {
	token := &models.PasswordResetToken{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
		Used:      false,
	}
	result := r.db.Create(token)
	return result.Error
}

// GetValidResetToken retrieves a valid (unused, non-expired) reset token by its hash
func (r *UserRepository) GetValidResetToken(tokenHash string) (*models.PasswordResetToken, error) {
	var token models.PasswordResetToken
	result := r.db.Where("token_hash = ? AND used = false AND expires_at > ?", tokenHash, time.Now()).First(&token)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("token inválido ou expirado")
		}
		return nil, result.Error
	}
	return &token, nil
}

// MarkResetTokenUsed marks a reset token as used
func (r *UserRepository) MarkResetTokenUsed(tokenID int) error {
	result := r.db.Model(&models.PasswordResetToken{}).Where("id = ?", tokenID).Update("used", true)
	return result.Error
}
