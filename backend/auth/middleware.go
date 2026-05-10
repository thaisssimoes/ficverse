package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/models"
)

// TokenValidator is an interface for validating tokens
type TokenValidator interface {
	ValidateToken(token string) (*models.User, error)
}

// AuthMiddleware creates a middleware that validates JWT tokens
func AuthMiddleware(authService TokenValidator) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Authorization header required",
				},
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>" format
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Invalid authorization header format",
				},
			})
			c.Abort()
			return
		}

		token := parts[1]

		// Validate token
		user, err := authService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Invalid or expired token",
				},
			})
			c.Abort()
			return
		}

		// Store user in context
		c.Set("user", user)
		c.Set("user_id", user.ID)

		c.Next()
	}
}

// OptionalAuthMiddleware reads the JWT token if present and sets the user in context,
// but does NOT abort if the token is missing or invalid — for public routes that
// behave differently for authenticated users (e.g. showing drafts to their author).
func OptionalAuthMiddleware(authService TokenValidator) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				if user, err := authService.ValidateToken(parts[1]); err == nil {
					c.Set("user", user)
					c.Set("user_id", user.ID)
				}
			}
		}
		c.Next()
	}
}

// GetCurrentUser retrieves the authenticated user from the context
func GetCurrentUser(c *gin.Context) (*models.User, bool) {
	user, exists := c.Get("user")
	if !exists {
		return nil, false
	}
	return user.(*models.User), true
}

// GetCurrentUserID retrieves the authenticated user ID from the context
func GetCurrentUserID(c *gin.Context) (int, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	return userID.(int), true
}

// AdminMiddleware rejects requests from non-admin users with 403.
// Must be used after AuthMiddleware (requires user to be set in context).
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := GetCurrentUser(c)
		if !exists || !user.IsAdmin {
			c.JSON(http.StatusForbidden, gin.H{
				"error": gin.H{
					"code":    "FORBIDDEN",
					"message": "Acesso restrito a administradoras.",
				},
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
