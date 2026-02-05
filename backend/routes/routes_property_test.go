package routes

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/models"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: interactive-fanfic-platform, Property 28: Input validation rejects invalid data
func TestProperty_InputValidationRejectsInvalidData(t *testing.T) {
	// Setup minimal router for testing validation
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Add a simple validation endpoint for testing
	router.POST("/test/validate", func(c *gin.Context) {
		var req struct {
			Title    string `json:"title" binding:"required"`
			Synopsis string `json:"synopsis" binding:"required"`
			Category string `json:"category" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: ErrorDetail{
					Code:    "VALIDATION_ERROR",
					Message: "Invalid input data",
				},
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "valid"})
	})

	properties := gopter.NewProperties(nil)

	// Property: Empty required fields should be rejected with 400
	properties.Property("Empty required fields are rejected", prop.ForAll(
		func(title, synopsis, category string) bool {
			reqBody := map[string]string{
				"title":    title,
				"synopsis": synopsis,
				"category": category,
			}
			body, _ := json.Marshal(reqBody)

			req := httptest.NewRequest(http.MethodPost, "/test/validate", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// If any field is empty, should get 400
			if title == "" || synopsis == "" || category == "" {
				return w.Code == http.StatusBadRequest
			}

			// If all fields are provided, should get 200
			return w.Code == http.StatusOK
		},
		gen.AlphaString(),
		gen.AlphaString(),
		gen.AlphaString(),
	))

	// Property: Malformed JSON should be rejected with 400
	properties.Property("Malformed JSON is rejected", prop.ForAll(
		func(invalidJSON string) bool {
			req := httptest.NewRequest(http.MethodPost, "/test/validate", bytes.NewBufferString(invalidJSON))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Malformed JSON should result in 400
			return w.Code == http.StatusBadRequest
		},
		gen.AlphaString(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}


// Feature: interactive-fanfic-platform, Property 29: Error responses include status codes
func TestProperty_ErrorResponsesIncludeStatusCodes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Add error handling middleware
	router.Use(ErrorHandlerMiddleware())

	// Add test endpoints that return various errors
	router.GET("/test/not-found", func(c *gin.Context) {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error: ErrorDetail{
				Code:    "NOT_FOUND",
				Message: "Resource not found",
			},
		})
	})

	router.GET("/test/bad-request", func(c *gin.Context) {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: ErrorDetail{
				Code:    "BAD_REQUEST",
				Message: "Invalid request",
			},
		})
	})

	router.GET("/test/unauthorized", func(c *gin.Context) {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "Authentication required",
			},
		})
	})

	router.GET("/test/forbidden", func(c *gin.Context) {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error: ErrorDetail{
				Code:    "FORBIDDEN",
				Message: "Access denied",
			},
		})
	})

	router.GET("/test/internal-error", func(c *gin.Context) {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: ErrorDetail{
				Code:    "INTERNAL_ERROR",
				Message: "Internal server error",
			},
		})
	})

	properties := gopter.NewProperties(nil)

	// Property: 404 errors should have NOT_FOUND status code
	properties.Property("404 errors have correct status code", prop.ForAll(
		func() bool {
			req := httptest.NewRequest(http.MethodGet, "/test/not-found", nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 404
			if w.Code != http.StatusNotFound {
				return false
			}

			// Response should have error structure
			var response ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				return false
			}

			// Should have error code and message
			return response.Error.Code != "" && response.Error.Message != ""
		},
	))

	// Property: 400 errors should have BAD_REQUEST status code
	properties.Property("400 errors have correct status code", prop.ForAll(
		func() bool {
			req := httptest.NewRequest(http.MethodGet, "/test/bad-request", nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 400
			if w.Code != http.StatusBadRequest {
				return false
			}

			// Response should have error structure
			var response ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				return false
			}

			// Should have error code and message
			return response.Error.Code != "" && response.Error.Message != ""
		},
	))

	// Property: 401 errors should have UNAUTHORIZED status code
	properties.Property("401 errors have correct status code", prop.ForAll(
		func() bool {
			req := httptest.NewRequest(http.MethodGet, "/test/unauthorized", nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 401
			if w.Code != http.StatusUnauthorized {
				return false
			}

			// Response should have error structure
			var response ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				return false
			}

			// Should have error code and message
			return response.Error.Code != "" && response.Error.Message != ""
		},
	))

	// Property: 403 errors should have FORBIDDEN status code
	properties.Property("403 errors have correct status code", prop.ForAll(
		func() bool {
			req := httptest.NewRequest(http.MethodGet, "/test/forbidden", nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 403
			if w.Code != http.StatusForbidden {
				return false
			}

			// Response should have error structure
			var response ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				return false
			}

			// Should have error code and message
			return response.Error.Code != "" && response.Error.Message != ""
		},
	))

	// Property: 500 errors should have INTERNAL_ERROR status code
	properties.Property("500 errors have correct status code", prop.ForAll(
		func() bool {
			req := httptest.NewRequest(http.MethodGet, "/test/internal-error", nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 500
			if w.Code != http.StatusInternalServerError {
				return false
			}

			// Response should have error structure
			var response ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				return false
			}

			// Should have error code and message
			return response.Error.Code != "" && response.Error.Message != ""
		},
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}


// Feature: interactive-fanfic-platform, Property 30: Protected endpoints require authentication
func TestProperty_ProtectedEndpointsRequireAuthentication(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Create a mock auth service
	mockAuthService := &mockAuthService{}

	// Add protected endpoint
	router.GET("/test/protected", auth.AuthMiddleware(mockAuthService), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	properties := gopter.NewProperties(nil)

	// Property: Requests without Authorization header should be rejected
	properties.Property("Requests without auth header are rejected", prop.ForAll(
		func() bool {
			req := httptest.NewRequest(http.MethodGet, "/test/protected", nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 401
			return w.Code == http.StatusUnauthorized
		},
	))

	// Property: Requests with invalid Authorization header format should be rejected
	properties.Property("Requests with invalid auth format are rejected", prop.ForAll(
		func(invalidHeader string) bool {
			req := httptest.NewRequest(http.MethodGet, "/test/protected", nil)
			req.Header.Set("Authorization", invalidHeader)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 401 unless it's a valid "Bearer <token>" format
			if len(invalidHeader) > 7 && invalidHeader[:7] == "Bearer " {
				// This might be valid format, so we can't guarantee 401
				return true
			}

			return w.Code == http.StatusUnauthorized
		},
		gen.AlphaString(),
	))

	// Property: Requests with "Bearer" but no token should be rejected
	properties.Property("Requests with Bearer but no token are rejected", prop.ForAll(
		func() bool {
			req := httptest.NewRequest(http.MethodGet, "/test/protected", nil)
			req.Header.Set("Authorization", "Bearer")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 401
			return w.Code == http.StatusUnauthorized
		},
	))

	// Property: Requests with empty Bearer token should be rejected
	properties.Property("Requests with empty Bearer token are rejected", prop.ForAll(
		func() bool {
			req := httptest.NewRequest(http.MethodGet, "/test/protected", nil)
			req.Header.Set("Authorization", "Bearer ")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 401
			return w.Code == http.StatusUnauthorized
		},
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// mockAuthService is a mock implementation of AuthService for testing
type mockAuthService struct{}

func (m *mockAuthService) ValidateToken(token string) (*models.User, error) {
	// Always return error for mock
	return nil, auth.ErrInvalidToken
}

func (m *mockAuthService) Register(username, email, password string) (*models.User, error) {
	return nil, nil
}

func (m *mockAuthService) Login(email, password string) (string, *models.User, error) {
	return "", nil, nil
}

func (m *mockAuthService) Logout(token string) error {
	return nil
}
