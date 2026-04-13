package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/auth"
	"github.com/interactive-fanfic-platform/config"
	"github.com/interactive-fanfic-platform/storage"
	"gorm.io/gorm"
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail contains error information
type ErrorDetail struct {
	Code    string        `json:"code"`
	Message string        `json:"message"`
	Details []FieldError  `json:"details,omitempty"`
}

// FieldError represents a field-specific error
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ErrorHandlerMiddleware handles panics and converts them to proper error responses
func ErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error: ErrorDetail{
						Code:    "INTERNAL_ERROR",
						Message: "An unexpected error occurred",
					},
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}

// CORSMiddleware handles CORS headers
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Setup configures all routes and middleware
func Setup(router *gin.Engine, db *gorm.DB, cfg *config.Config, store storage.StorageService) {
	// Add CORS middleware
	router.Use(CORSMiddleware())
	
	// Add error handling middleware
	router.Use(ErrorHandlerMiddleware())

	// Serve static files (uploaded covers)
	router.Static("/uploads", "./uploads")

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Initialize services
	emailService := auth.NewEmailService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword)
	authService := auth.NewAuthService(db, cfg.JWTSecret, emailService, cfg.FrontendURL)

	// Create handlers
	authHandler := NewAuthHandler(authService)
	fanficHandler := NewFanficHandler(db, store)
	chapterHandler := NewChapterHandler(db, store)
	interactiveHandler := NewInteractiveHandler(db)
	commentHandler := NewCommentHandler(db)
	searchHandler := NewSearchHandler(db)
	notificationHandler := NewNotificationHandler(db)
	readingListHandler := NewReadingListHandler(db)
	tagHandler := NewTagHandler(db)
	favoriteHandler := NewFavoriteHandler(db)
	readerProfileHandler := NewReaderProfileHandler(db)
	userHandler := NewUserHandler(db, authService, store)
	wallHandler := NewWallHandler(db)

	// API routes
	api := router.Group("/api")
	{
		// Auth routes (public)
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/logout", authHandler.Logout)
			authGroup.POST("/forgot-password", authHandler.ForgotPassword)
			authGroup.POST("/reset-password", authHandler.ResetPassword)
		}

		// Fanfic routes
		fanfics := api.Group("/fanfics")
		{
			fanfics.GET("", fanficHandler.ListByCategory)
			fanfics.GET("/featured", fanficHandler.GetFeatured)
			fanfics.GET("/trending", fanficHandler.GetTrending)
			fanfics.GET("/search/tags", tagHandler.SearchFanficsByTags)
			fanfics.GET("/:id", auth.OptionalAuthMiddleware(authService), fanficHandler.GetByID)
			fanfics.POST("", auth.AuthMiddleware(authService), fanficHandler.Create)
			fanfics.PUT("/:id", auth.AuthMiddleware(authService), fanficHandler.Update)
			fanfics.DELETE("/:id", auth.AuthMiddleware(authService), fanficHandler.Delete)
			fanfics.POST("/:id/publish", auth.AuthMiddleware(authService), fanficHandler.Publish)
			fanfics.POST("/:id/unpublish", auth.AuthMiddleware(authService), fanficHandler.Unpublish)
			fanfics.POST("/:id/cover", auth.AuthMiddleware(authService), fanficHandler.UploadCover)
			
			// Tag routes under fanfics
			fanfics.GET("/:id/tags", tagHandler.GetFanficTags)
			fanfics.POST("/:id/tags", auth.AuthMiddleware(authService), tagHandler.AddTagsToFanfic)
			fanfics.DELETE("/:id/tags/:tagId", auth.AuthMiddleware(authService), tagHandler.RemoveTagFromFanfic)
			
			// Chapter routes under fanfics — OptionalAuth para autor ver rascunhos
			fanfics.GET("/:id/chapters", auth.OptionalAuthMiddleware(authService), chapterHandler.ListByFanfic)
			fanfics.POST("/:id/chapters", auth.AuthMiddleware(authService), chapterHandler.Create)
			fanfics.PUT("/:id/chapters/reorder", auth.AuthMiddleware(authService), chapterHandler.Reorder)
			
			// Interactive mode routes
			fanfics.GET("/:id/questions", interactiveHandler.ListQuestions)
			fanfics.POST("/:id/questions", auth.AuthMiddleware(authService), interactiveHandler.CreateQuestion)
			fanfics.GET("/:id/answers", auth.AuthMiddleware(authService), interactiveHandler.GetAnswers)
			fanfics.POST("/:id/answers", auth.AuthMiddleware(authService), interactiveHandler.SaveAnswers)
			fanfics.PUT("/:id/answers", auth.AuthMiddleware(authService), interactiveHandler.UpdateAnswers)
			fanfics.GET("/:id/pending-questions", auth.AuthMiddleware(authService), interactiveHandler.GetPendingQuestions)
			
			// Comment routes for fanfics
			fanfics.GET("/:id/comments", commentHandler.ListFanficComments)
			fanfics.POST("/:id/comments", auth.AuthMiddleware(authService), commentHandler.CreateFanficComment)

			// Favorite routes
			fanfics.GET("/:id/favorite", favoriteHandler.GetFavoriteStatus)
			fanfics.POST("/:id/favorite", auth.AuthMiddleware(authService), favoriteHandler.ToggleFavorite)
		}

		// Favorites list (authenticated)
		api.GET("/favorites", auth.AuthMiddleware(authService), favoriteHandler.GetUserFavorites)

		// User routes
		users := api.Group("/users")
		{
			// OptionalAuth: anônimos veem apenas publicadas, o próprio autor vê também os rascunhos
			users.GET("/:id/fanfics", auth.OptionalAuthMiddleware(authService), fanficHandler.GetByAuthor)
		}

		// Chapter routes
		chapters := api.Group("/chapters")
		{
			chapters.GET("/:id", auth.OptionalAuthMiddleware(authService), chapterHandler.GetByID)
			chapters.PUT("/:id", auth.AuthMiddleware(authService), chapterHandler.Update)
			chapters.DELETE("/:id", auth.AuthMiddleware(authService), chapterHandler.Delete)
			chapters.POST("/:id/publish", auth.AuthMiddleware(authService), chapterHandler.Publish)
			chapters.POST("/:id/cover", auth.AuthMiddleware(authService), chapterHandler.UploadCover)

			// Comment routes for chapters
			chapters.GET("/:id/comments", commentHandler.ListChapterComments)
			chapters.POST("/:id/comments", auth.AuthMiddleware(authService), commentHandler.CreateChapterComment)
		}

		// Question routes
		questions := api.Group("/questions")
		{
			questions.PUT("/:id", auth.AuthMiddleware(authService), interactiveHandler.UpdateQuestion)
			questions.DELETE("/:id", auth.AuthMiddleware(authService), interactiveHandler.DeleteQuestion)
		}

		// Comment routes
		comments := api.Group("/comments")
		{
			comments.PUT("/:id", auth.AuthMiddleware(authService), commentHandler.Update)
			comments.DELETE("/:id", auth.AuthMiddleware(authService), commentHandler.Delete)
		}

		// Render stateless — motor de tags (sem auth, transformação pura)
		api.POST("/interactive/render", interactiveHandler.Render)

		// Search routes
		search := api.Group("/search")
		{
			search.GET("/suggestions", searchHandler.GetSuggestions)
			search.GET("", searchHandler.Search)
		}

		// Notification routes
		notifications := api.Group("/notifications")
		{
			notifications.GET("", auth.AuthMiddleware(authService), notificationHandler.GetNotifications)
			notifications.GET("/unread-count", auth.AuthMiddleware(authService), notificationHandler.GetUnreadCount)
			notifications.PUT("/:id/read", auth.AuthMiddleware(authService), notificationHandler.MarkAsRead)
			notifications.PUT("/read-all", auth.AuthMiddleware(authService), notificationHandler.MarkAllAsRead)
			notifications.DELETE("/:id", auth.AuthMiddleware(authService), notificationHandler.Delete)
		}

		// Reading list routes
		api.GET("/reading-list", auth.AuthMiddleware(authService), readingListHandler.GetReadingList)
		api.POST("/reading-progress", auth.AuthMiddleware(authService), readingListHandler.UpdateProgress)

		// Tag routes
		tags := api.Group("/tags")
		{
			tags.POST("", auth.AuthMiddleware(authService), tagHandler.CreateTag)
			tags.GET("", tagHandler.ListTagsByType)
			tags.GET("/search", tagHandler.SearchTags)
		}

		// Reader profile routes
		profile := api.Group("/profile")
		{
			profile.GET("/standard-variables", readerProfileHandler.GetStandardVariables)
			// Backward compat — single profile
			profile.GET("/reader-profile", auth.AuthMiddleware(authService), readerProfileHandler.GetReaderProfile)
			profile.PUT("/reader-profile", auth.AuthMiddleware(authService), readerProfileHandler.UpdateReaderProfile)
			// Multi-profile CRUD
			profile.GET("/profiles", auth.AuthMiddleware(authService), readerProfileHandler.ListProfiles)
			profile.POST("/profiles", auth.AuthMiddleware(authService), readerProfileHandler.CreateProfile)
			profile.PUT("/profiles/:id", auth.AuthMiddleware(authService), readerProfileHandler.UpdateProfile)
			profile.DELETE("/profiles/:id", auth.AuthMiddleware(authService), readerProfileHandler.DeleteProfile)
		}

		// User routes — public profile + upload + block
		userGroup := api.Group("/user")
		{
			userGroup.GET("/me", auth.AuthMiddleware(authService), userHandler.GetCurrentUserProfile)
			userGroup.PUT("/bio", auth.AuthMiddleware(authService), userHandler.UpdateBio)
			userGroup.POST("/avatar", auth.AuthMiddleware(authService), userHandler.UploadAvatar)
			userGroup.POST("/banner", auth.AuthMiddleware(authService), userHandler.UploadBanner)
			// Public profile by username (optional auth to check block status)
			userGroup.GET("/:username", auth.OptionalAuthMiddleware(authService), userHandler.GetPublicProfile)
			// Block / unblock
			userGroup.POST("/:id/block", auth.AuthMiddleware(authService), userHandler.BlockUser)
			userGroup.DELETE("/:id/block", auth.AuthMiddleware(authService), userHandler.UnblockUser)
		}

		// Wall (mural) routes
		wallGroup := api.Group("/wall")
		{
			// Get and post messages on a user's wall
			wallGroup.GET("/user/:id", wallHandler.GetWallMessages)
			wallGroup.POST("/user/:id", auth.AuthMiddleware(authService), wallHandler.PostWallMessage)
			// Moderation — delete or pin a specific message
			wallGroup.DELETE("/:msgId", auth.AuthMiddleware(authService), wallHandler.DeleteWallMessage)
			wallGroup.PUT("/:msgId/pin", auth.AuthMiddleware(authService), wallHandler.PinWallMessage)
		}
	}
}

