package api

import (
	"net/http"
	"strconv"

	"github.com/ethereum/go-ethereum/common"
	"github.com/gin-gonic/gin"
	"github.com/kaldun-tech/token-vesting-backend/internal/blockchain"
	"github.com/kaldun-tech/token-vesting-backend/internal/database"
)

type Handler struct {
	db         *database.Database
	blockchain *blockchain.Client
}

func NewHandler(db *database.Database, bc *blockchain.Client) *Handler {
	return &Handler{
		db:         db,
		blockchain: bc,
	}
}

// GetSchedule retrieves a vesting schedule for a beneficiary
// GET /api/schedules/:address
func (h *Handler) GetSchedule(c *gin.Context) {
	address := c.Param("address")

	if !common.IsHexAddress(address) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Ethereum address"})
		return
	}

	// Get from database
	schedule, err := h.db.GetScheduleByBeneficiary(address)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schedule not found"})
		return
	}

	c.JSON(http.StatusOK, schedule)
}

// GetAllSchedules retrieves all vesting schedules with pagination
// GET /api/schedules?limit=10&offset=0
func (h *Handler) GetAllSchedules(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 1000 {
		limit = 1000
	}

	schedules, err := h.db.GetAllSchedules(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve schedules"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"schedules": schedules,
		"limit":     limit,
		"offset":    offset,
		"count":     len(schedules),
	})
}

// GetVestedAmount retrieves the current vested amount for a beneficiary
// GET /api/vested/:address
func (h *Handler) GetVestedAmount(c *gin.Context) {
	address := c.Param("address")

	if !common.IsHexAddress(address) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Ethereum address"})
		return
	}

	// Get from blockchain
	vestedAmount, err := h.blockchain.GetVestedAmount(common.HexToAddress(address))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get vested amount"})
		return
	}

	// Also get schedule from database
	schedule, err := h.db.GetScheduleByBeneficiary(address)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schedule not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"beneficiary":    address,
		"vested_amount":  vestedAmount.String(),
		"total_amount":   schedule.Amount,
		"released":       schedule.Released,
		"unreleased":     vestedAmount.String(), // vested - released
	})
}

// GetEvents retrieves events for a beneficiary
// GET /api/events/:address?limit=10&offset=0
func (h *Handler) GetEvents(c *gin.Context) {
	address := c.Param("address")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if !common.IsHexAddress(address) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Ethereum address"})
		return
	}

	if limit > 1000 {
		limit = 1000
	}

	events, err := h.db.GetEventsByBeneficiary(address, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"limit":  limit,
		"offset": offset,
		"count":  len(events),
	})
}

// HealthCheck endpoint
// GET /health
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"service": "token-vesting-api",
	})
}

// GetStats retrieves statistics about vesting schedules
// GET /api/stats
func (h *Handler) GetStats(c *gin.Context) {
	// This would aggregate data from the database
	// For now, return basic stats
	schedules, err := h.db.GetAllSchedules(1000, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_schedules": len(schedules),
		"active_schedules": len(schedules), // Count non-revoked
	})
}
