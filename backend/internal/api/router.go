package api

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(handler *Handler) *gin.Engine {
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/health", handler.HealthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Vesting schedules
		v1.GET("/schedules", handler.GetAllSchedules)
		v1.GET("/schedules/:address", handler.GetSchedule)

		// Vested amounts
		v1.GET("/vested/:address", handler.GetVestedAmount)

		// Events
		v1.GET("/events/:address", handler.GetEvents)

		// Statistics
		v1.GET("/stats", handler.GetStats)
	}

	return router
}
