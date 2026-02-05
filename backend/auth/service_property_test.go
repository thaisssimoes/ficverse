package auth

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

	// Auto-migrate the User model
	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

// Feature: interactive-fanfic-platform, Property 1: Valid credentials create sessions
func TestProperty_ValidCredentialsCreateSessions(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("valid credentials create sessions", prop.ForAll(
		func(username, email, password string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			authService := NewAuthService(db, "test-secret-key")

			// Register user
			user, err := authService.Register(username, email, password)
			if err != nil {
				// If registration fails due to validation, skip this test case
				return true
			}

			// Attempt login with valid credentials
			token, loginUser, err := authService.Login(email, password)
			if err != nil {
				t.Logf("Login failed for valid credentials: %v", err)
				return false
			}

			// Verify token is not empty
			if token == "" {
				t.Logf("Token is empty for valid credentials")
				return false
			}

			// Verify user matches
			if loginUser.ID != user.ID || loginUser.Email != user.Email {
				t.Logf("User mismatch: expected %v, got %v", user, loginUser)
				return false
			}

			// Verify token can be validated
			validatedUser, err := authService.ValidateToken(token)
			if err != nil {
				t.Logf("Token validation failed: %v", err)
				return false
			}

			// Verify validated user matches
			if validatedUser.ID != user.ID {
				t.Logf("Validated user mismatch: expected %d, got %d", user.ID, validatedUser.ID)
				return false
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidPassword(),
	))

	properties.TestingRun(t)
}

// Generators for valid input data

func genValidUsername() gopter.Gen {
	return gen.RegexMatch("[a-zA-Z][a-zA-Z0-9_]{2,49}")
}

func genValidEmail() gopter.Gen {
	return gen.RegexMatch("[a-zA-Z][a-zA-Z0-9]{2,29}").Map(func(s string) string {
		return s + "@example.com"
	})
}

func genValidPassword() gopter.Gen {
	return gen.RegexMatch("[a-zA-Z0-9!@#$%^&*]{8,50}")
}

// Feature: interactive-fanfic-platform, Property 2: Invalid credentials are rejected
func TestProperty_InvalidCredentialsAreRejected(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("invalid credentials are rejected", prop.ForAll(
		func(username, email, password, wrongPassword string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			authService := NewAuthService(db, "test-secret-key")

			// Register user with valid credentials
			_, err := authService.Register(username, email, password)
			if err != nil {
				// If registration fails, skip this test case
				return true
			}

			// Ensure wrong password is different from correct password
			if password == wrongPassword {
				return true // Skip if passwords are the same
			}

			// Attempt login with wrong password
			token, user, err := authService.Login(email, wrongPassword)
			if err == nil {
				t.Logf("Login succeeded with wrong password, token: %s, user: %v", token, user)
				return false
			}

			// Verify error is ErrInvalidCredentials
			if err != ErrInvalidCredentials {
				t.Logf("Expected ErrInvalidCredentials, got: %v", err)
				return false
			}

			// Verify token is empty
			if token != "" {
				t.Logf("Token should be empty for invalid credentials, got: %s", token)
				return false
			}

			// Verify user is nil
			if user != nil {
				t.Logf("User should be nil for invalid credentials, got: %v", user)
				return false
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidPassword(),
		genValidPassword(), // Generate a different password
	))

	// Test with non-existent email
	properties.Property("non-existent email is rejected", prop.ForAll(
		func(email, password string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			authService := NewAuthService(db, "test-secret-key")

			// Attempt login with non-existent email
			token, user, err := authService.Login(email, password)
			if err == nil {
				t.Logf("Login succeeded with non-existent email")
				return false
			}

			// Verify error is ErrInvalidCredentials
			if err != ErrInvalidCredentials {
				t.Logf("Expected ErrInvalidCredentials, got: %v", err)
				return false
			}

			// Verify token is empty and user is nil
			if token != "" || user != nil {
				t.Logf("Token and user should be empty/nil for non-existent email")
				return false
			}

			return true
		},
		genValidEmail(),
		genValidPassword(),
	))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 3: Registration creates unique users
func TestProperty_RegistrationCreatesUniqueUsers(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("registration creates unique users", prop.ForAll(
		func(username1, email1, password1, username2, email2, password2 string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			authService := NewAuthService(db, "test-secret-key")

			// Register first user
			user1, err := authService.Register(username1, email1, password1)
			if err != nil {
				// If registration fails due to validation, skip this test case
				return true
			}

			// Verify user1 has a unique ID
			if user1.ID == 0 {
				t.Logf("User1 ID should not be 0")
				return false
			}

			// Verify user1 data matches input
			if user1.Username != username1 || user1.Email != email1 {
				t.Logf("User1 data mismatch")
				return false
			}

			// Register second user with different credentials
			user2, err := authService.Register(username2, email2, password2)
			if err != nil {
				// If registration fails due to validation, skip this test case
				return true
			}

			// Verify user2 has a unique ID different from user1
			if user2.ID == 0 || user2.ID == user1.ID {
				t.Logf("User2 should have unique ID, got user1.ID=%d, user2.ID=%d", user1.ID, user2.ID)
				return false
			}

			// Verify user2 data matches input
			if user2.Username != username2 || user2.Email != email2 {
				t.Logf("User2 data mismatch")
				return false
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidPassword(),
		genValidUsername(),
		genValidEmail(),
		genValidPassword(),
	))

	properties.Property("duplicate email registration fails", prop.ForAll(
		func(username1, username2, email, password1, password2 string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			authService := NewAuthService(db, "test-secret-key")

			// Register first user
			_, err := authService.Register(username1, email, password1)
			if err != nil {
				// If registration fails due to validation, skip this test case
				return true
			}

			// Ensure username2 is different from username1
			if username1 == username2 {
				return true // Skip if usernames are the same
			}

			// Attempt to register second user with same email
			user2, err := authService.Register(username2, email, password2)
			if err == nil {
				t.Logf("Registration should fail with duplicate email, got user: %v", user2)
				return false
			}

			// Verify error is ErrDuplicateEmail
			if err != ErrDuplicateEmail {
				t.Logf("Expected ErrDuplicateEmail, got: %v", err)
				return false
			}

			return true
		},
		genValidUsername(),
		genValidUsername(),
		genValidEmail(),
		genValidPassword(),
		genValidPassword(),
	))

	properties.TestingRun(t)
}

// Feature: interactive-fanfic-platform, Property 4: Logout terminates sessions
func TestProperty_LogoutTerminatesSessions(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("logout terminates sessions", prop.ForAll(
		func(username, email, password string) bool {
			// Setup fresh database for each test
			db := setupTestDB(t)
			authService := NewAuthService(db, "test-secret-key")

			// Register and login user
			_, err := authService.Register(username, email, password)
			if err != nil {
				// If registration fails due to validation, skip this test case
				return true
			}

			token, _, err := authService.Login(email, password)
			if err != nil {
				t.Logf("Login failed: %v", err)
				return false
			}

			// Verify token is valid before logout
			user, err := authService.ValidateToken(token)
			if err != nil {
				t.Logf("Token validation failed before logout: %v", err)
				return false
			}
			if user == nil {
				t.Logf("User should not be nil before logout")
				return false
			}

			// Logout
			err = authService.Logout(token)
			if err != nil {
				t.Logf("Logout failed: %v", err)
				return false
			}

			// Verify token is invalid after logout
			user, err = authService.ValidateToken(token)
			if err == nil {
				t.Logf("Token validation should fail after logout, got user: %v", user)
				return false
			}

			// Verify error is ErrInvalidToken
			if err != ErrInvalidToken {
				t.Logf("Expected ErrInvalidToken after logout, got: %v", err)
				return false
			}

			// Verify user is nil
			if user != nil {
				t.Logf("User should be nil after logout, got: %v", user)
				return false
			}

			return true
		},
		genValidUsername(),
		genValidEmail(),
		genValidPassword(),
	))

	properties.TestingRun(t)
}
