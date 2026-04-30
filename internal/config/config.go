package config

import (
	"os"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
	Env         string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}

	return &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   getEnvOrDefault("JWT_SECRET", "laotse-records-secret-change-in-prod"),
		Port:        port,
		Env:         env,
	}
}

func getEnvOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
