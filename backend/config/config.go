package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	DatabaseURL  string
	JWTSecret    string
	Port         string
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	FrontendURL  string
	AutoMigrate  bool
}

func Load() *Config {
	// Set config file name and path
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./backend")
	viper.AddConfigPath("..")

	// Set defaults
	viper.SetDefault("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/fanfic_platform?sslmode=disable")
	viper.SetDefault("JWT_SECRET", "your-secret-key-change-in-production")
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("SMTP_HOST", "smtp.gmail.com")
	viper.SetDefault("SMTP_PORT", "587")
	viper.SetDefault("SMTP_USER", "")
	viper.SetDefault("SMTP_PASSWORD", "")
	viper.SetDefault("FRONTEND_URL", "http://localhost:3000")
	viper.SetDefault("AUTO_MIGRATE", false)

	// Enable reading from environment variables
	viper.AutomaticEnv()

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Could not read config file: %v", err)
		log.Println("Using environment variables and defaults")
	} else {
		log.Printf("Config file loaded: %s", viper.ConfigFileUsed())
	}

	return &Config{
		DatabaseURL:  viper.GetString("DATABASE_URL"),
		JWTSecret:    viper.GetString("JWT_SECRET"),
		Port:         viper.GetString("PORT"),
		SMTPHost:     viper.GetString("SMTP_HOST"),
		SMTPPort:     viper.GetString("SMTP_PORT"),
		SMTPUser:     viper.GetString("SMTP_USER"),
		SMTPPassword: viper.GetString("SMTP_PASSWORD"),
		FrontendURL:  viper.GetString("FRONTEND_URL"),
		AutoMigrate:  viper.GetBool("AUTO_MIGRATE"),
	}
}
