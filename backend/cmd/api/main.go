package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/yourusername/token-vesting-backend/internal/api"
	"github.com/yourusername/token-vesting-backend/internal/blockchain"
	"github.com/yourusername/token-vesting-backend/internal/config"
	"github.com/yourusername/token-vesting-backend/internal/database"
)

func main() {
	log.Println("🚀 Starting Token Vesting API Server...")

	// Load configuration
	cfg := config.Load()
	log.Printf("📝 Environment: %s", cfg.Environment)

	// Connect to database
	db, err := database.NewDatabase(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	log.Println("✅ Database connected")

	// Connect to blockchain
	bc, err := blockchain.NewClient(cfg)
	if err != nil {
		log.Fatalf("❌ Failed to connect to blockchain: %v", err)
	}
	defer bc.Close()
	log.Println("✅ Blockchain client connected")

	// Create event listener
	listener := blockchain.NewEventListener(bc, db)

	// Start event listener in background
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		if err := listener.Start(ctx, cfg.StartBlock); err != nil {
			log.Printf("⚠️  Event listener error: %v", err)
		}
	}()

	// Setup API router
	handler := api.NewHandler(db, bc)
	router := api.SetupRouter(handler)

	// Start HTTP server
	serverAddr := ":" + cfg.ServerPort
	log.Printf("🌐 Server starting on %s", serverAddr)
	log.Printf("📖 API Documentation available at http://localhost:%s/health", cfg.ServerPort)

	// Graceful shutdown
	go func() {
		if err := router.Run(serverAddr); err != nil {
			log.Fatalf("❌ Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")
	cancel()

	// Give time for cleanup
	time.Sleep(2 * time.Second)
	log.Println("✅ Server stopped")
}
