package auth

import (
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"github.com/interactive-fanfic-platform/models"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDBForUnit(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Auto-migrate the User model
	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

// Test duplicate email registration
func TestDuplicateEmailRegistration(t *testing.T) {
	db := setupTestDBForUnit(t)
	authService := NewAuthService(db, "test-secret-key", nil, "")

	// Register first user
	_, err := authService.Register("user1", "test@example.com", "password123")
	if err != nil {
		t.Fatalf("First registration failed: %v", err)
	}

	// Attempt to register second user with same email
	_, err = authService.Register("user2", "test@example.com", "password456")
	if err == nil {
		t.Fatal("Expected error for duplicate email, got nil")
	}

	if err != ErrDuplicateEmail {
		t.Errorf("Expected ErrDuplicateEmail, got: %v", err)
	}
}

// Test password validation - too short
func TestPasswordTooShort(t *testing.T) {
	db := setupTestDBForUnit(t)
	authService := NewAuthService(db, "test-secret-key", nil, "")

	// Attempt to register with short password
	_, err := authService.Register("user1", "test@example.com", "short")
	if err == nil {
		t.Fatal("Expected error for short password, got nil")
	}

	if err != ErrPasswordTooShort {
		t.Errorf("Expected ErrPasswordTooShort, got: %v", err)
	}
}

// Test password validation - minimum length
func TestPasswordMinimumLength(t *testing.T) {
	db := setupTestDBForUnit(t)
	authService := NewAuthService(db, "test-secret-key", nil, "")

	// Register with exactly 8 characters (minimum)
	user, err := authService.Register("user1", "test@example.com", "12345678")
	if err != nil {
		t.Fatalf("Registration with 8-character password failed: %v", err)
	}

	if user == nil {
		t.Fatal("Expected user to be created")
	}
}

// Test invalid email format
func TestInvalidEmailFormat(t *testing.T) {
	db := setupTestDBForUnit(t)
	authService := NewAuthService(db, "test-secret-key", nil, "")

	testCases := []struct {
		name  string
		email string
	}{
		{"no at symbol", "testexample.com"},
		{"no domain", "test@"},
		{"no local part", "@example.com"},
		{"no dot after at", "test@example"},
		{"empty", ""},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := authService.Register("user1", tc.email, "password123")
			if err == nil {
				t.Errorf("Expected error for invalid email '%s', got nil", tc.email)
			}

			if err != ErrInvalidEmail {
				t.Errorf("Expected ErrInvalidEmail for '%s', got: %v", tc.email, err)
			}
		})
	}
}

// Test valid email formats
func TestValidEmailFormats(t *testing.T) {
	testCases := []string{
		"test@example.com",
		"user.name@example.com",
		"user+tag@example.co.uk",
		"test123@test.org",
	}

	for _, email := range testCases {
		t.Run(email, func(t *testing.T) {
			db := setupTestDBForUnit(t)
			authService := NewAuthService(db, "test-secret-key", nil, "")

			user, err := authService.Register("user1", email, "password123")
			if err != nil {
				t.Errorf("Registration failed for valid email '%s': %v", email, err)
			}

			if user == nil {
				t.Errorf("Expected user to be created for email '%s'", email)
			}
		})
	}
}

// Test empty username
func TestEmptyUsername(t *testing.T) {
	db := setupTestDBForUnit(t)
	authService := NewAuthService(db, "test-secret-key", nil, "")

	_, err := authService.Register("", "test@example.com", "password123")
	if err == nil {
		t.Fatal("Expected error for empty username, got nil")
	}

	if err != ErrUsernameRequired {
		t.Errorf("Expected ErrUsernameRequired, got: %v", err)
	}
}

// Test token expiration (simulated)
func TestTokenValidation(t *testing.T) {
	db := setupTestDBForUnit(t)
	authService := NewAuthService(db, "test-secret-key", nil, "")

	// Register and login
	_, err := authService.Register("user1", "test@example.com", "password123")
	if err != nil {
		t.Fatalf("Registration failed: %v", err)
	}

	token, _, err := authService.Login("test@example.com", "password123")
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}

	// Validate token
	user, err := authService.ValidateToken(token)
	if err != nil {
		t.Fatalf("Token validation failed: %v", err)
	}

	if user == nil {
		t.Fatal("Expected user from valid token")
	}

	if user.Email != "test@example.com" {
		t.Errorf("Expected email 'test@example.com', got: %s", user.Email)
	}
}

// Test invalid token format
func TestInvalidTokenFormat(t *testing.T) {
	db := setupTestDBForUnit(t)
	authService := NewAuthService(db, "test-secret-key", nil, "")

	testCases := []string{
		"invalid-token",
		"",
		"Bearer token",
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
	}

	for _, token := range testCases {
		t.Run(token, func(t *testing.T) {
			user, err := authService.ValidateToken(token)
			if err == nil {
				t.Errorf("Expected error for invalid token '%s', got nil", token)
			}

			if user != nil {
				t.Errorf("Expected nil user for invalid token, got: %v", user)
			}
		})
	}
}

// Test password hashing
func TestPasswordHashing(t *testing.T) {
	db := setupTestDBForUnit(t)
	repo := NewUserRepository(db)

	password := "mySecretPassword123"

	// Create user
	user, err := repo.Create("testuser", "test@example.com", password)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Verify password hash is not the plain password
	if user.PasswordHash == password {
		t.Error("Password should be hashed, not stored in plain text")
	}

	// Verify password can be verified
	if !repo.VerifyPassword(user, password) {
		t.Error("Password verification failed for correct password")
	}

	// Verify wrong password fails
	if repo.VerifyPassword(user, "wrongPassword") {
		t.Error("Password verification should fail for wrong password")
	}
}
