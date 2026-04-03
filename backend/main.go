package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/config"
	"github.com/interactive-fanfic-platform/database"
	"github.com/interactive-fanfic-platform/routes"
)

func main() {
	// Load configuration (Viper handles .env automatically)
	cfg := config.Load()

	// Initialize database
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	log.Println("Database connected successfully!")

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Setup router
	router := gin.Default()
	routes.Setup(router, db, cfg)

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
