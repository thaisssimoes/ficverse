package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
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
		DatabaseURL: viper.GetString("DATABASE_URL"),
		JWTSecret:   viper.GetString("JWT_SECRET"),
		Port:        viper.GetString("PORT"),
	}
}
