package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server configuration
	ServerPort string

	// Database configuration
	DatabaseURL string

	// Blockchain configuration
	EthereumRPC           string
	TokenVestingAddress   string
	TokenAddress          string
	ChainID               int64
	PrivateKey            string // Optional: for admin operations
	StartBlock            uint64 // Block to start event syncing from

	// Application configuration
	Environment string
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		ServerPort:          getEnv("SERVER_PORT", "8080"),
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://user:password@localhost:5432/vesting?sslmode=disable"),
		EthereumRPC:         getEnv("ETHEREUM_RPC", "https://sepolia.base.org"),
		TokenVestingAddress: getEnv("VESTING_CONTRACT_ADDRESS", ""),
		TokenAddress:        getEnv("TOKEN_ADDRESS", ""),
		ChainID:             getEnvInt64("CHAIN_ID", 84532), // Base Sepolia
		PrivateKey:          getEnv("PRIVATE_KEY", ""),
		StartBlock:          getEnvUint64("START_BLOCK", 0),
		Environment:         getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		var result int64
		if _, err := fmt.Sscanf(value, "%d", &result); err == nil {
			return result
		}
	}
	return defaultValue
}

func getEnvUint64(key string, defaultValue uint64) uint64 {
	if value := os.Getenv(key); value != "" {
		var result uint64
		if _, err := fmt.Sscanf(value, "%d", &result); err == nil {
			return result
		}
	}
	return defaultValue
}
