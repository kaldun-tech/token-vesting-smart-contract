package database

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/kaldun-tech/token-vesting-backend/internal/models"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *Database {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	// Auto-migrate tables
	err = db.AutoMigrate(&models.VestingSchedule{}, &models.VestingEvent{})
	assert.NoError(t, err)

	return &Database{DB: db}
}

func TestCreateOrUpdateSchedule(t *testing.T) {
	db := setupTestDB(t)

	schedule := &models.VestingSchedule{
		Beneficiary: "0xF25DA65784D566fFCC60A1f113650afB688A14ED",
		Start:       time.Now(),
		Cliff:       time.Now().Add(365 * 24 * time.Hour),
		Duration:    4 * 365 * 24 * 60 * 60, // 4 years in seconds
		Amount:      "1000000000000000000000",
		Released:    "0",
		Revocable:   true,
		Revoked:     false,
	}

	// Test create
	err := db.CreateOrUpdateSchedule(schedule)
	assert.NoError(t, err)

	// Test retrieve
	retrieved, err := db.GetScheduleByBeneficiary(schedule.Beneficiary)
	assert.NoError(t, err)
	assert.Equal(t, schedule.Beneficiary, retrieved.Beneficiary)
	assert.Equal(t, schedule.Amount, retrieved.Amount)

	// Test update
	schedule.Released = "500000000000000000000"
	err = db.CreateOrUpdateSchedule(schedule)
	assert.NoError(t, err)

	updated, err := db.GetScheduleByBeneficiary(schedule.Beneficiary)
	assert.NoError(t, err)
	assert.Equal(t, "500000000000000000000", updated.Released)
}

func TestGetScheduleByBeneficiary_NotFound(t *testing.T) {
	db := setupTestDB(t)

	_, err := db.GetScheduleByBeneficiary("0x0000000000000000000000000000000000000000")
	assert.Error(t, err)
}

func TestGetAllSchedules(t *testing.T) {
	db := setupTestDB(t)

	// Create multiple schedules
	for i := 0; i < 5; i++ {
		schedule := &models.VestingSchedule{
			Beneficiary: "0x000000000000000000000000000000000000000" + string('0'+rune(i)),
			Start:       time.Now(),
			Cliff:       time.Now().Add(365 * 24 * time.Hour),
			Duration:    4 * 365 * 24 * 60 * 60,
			Amount:      "1000000000000000000000",
			Released:    "0",
			Revocable:   true,
			Revoked:     false,
		}
		err := db.CreateOrUpdateSchedule(schedule)
		assert.NoError(t, err)
	}

	// Test pagination
	schedules, err := db.GetAllSchedules(3, 0)
	assert.NoError(t, err)
	assert.Len(t, schedules, 3)

	schedules, err = db.GetAllSchedules(10, 0)
	assert.NoError(t, err)
	assert.Len(t, schedules, 5)
}

func TestMarkScheduleAsRevoked(t *testing.T) {
	db := setupTestDB(t)

	beneficiary := "0xF25DA65784D566fFCC60A1f113650afB688A14ED"

	// Create schedule
	schedule := &models.VestingSchedule{
		Beneficiary: beneficiary,
		Start:       time.Now(),
		Cliff:       time.Now().Add(365 * 24 * time.Hour),
		Duration:    4 * 365 * 24 * 60 * 60,
		Amount:      "1000000000000000000000",
		Released:    "0",
		Revocable:   true,
		Revoked:     false,
	}
	err := db.CreateOrUpdateSchedule(schedule)
	assert.NoError(t, err)

	// Mark as revoked
	err = db.MarkScheduleAsRevoked(beneficiary)
	assert.NoError(t, err)

	// Verify it's revoked
	_, err = db.GetScheduleByBeneficiary(beneficiary)
	// Should return error because GetScheduleByBeneficiary filters out revoked schedules
	assert.Error(t, err)
}

func TestUpdateReleased(t *testing.T) {
	db := setupTestDB(t)

	beneficiary := "0xF25DA65784D566fFCC60A1f113650afB688A14ED"

	// Create schedule
	schedule := &models.VestingSchedule{
		Beneficiary: beneficiary,
		Start:       time.Now(),
		Cliff:       time.Now().Add(365 * 24 * time.Hour),
		Duration:    4 * 365 * 24 * 60 * 60,
		Amount:      "1000000000000000000000",
		Released:    "0",
		Revocable:   true,
		Revoked:     false,
	}
	err := db.CreateOrUpdateSchedule(schedule)
	assert.NoError(t, err)

	// Update released amount
	newReleased := "250000000000000000000"
	err = db.UpdateReleased(beneficiary, newReleased)
	assert.NoError(t, err)

	// Verify update
	retrieved, err := db.GetScheduleByBeneficiary(beneficiary)
	assert.NoError(t, err)
	assert.Equal(t, newReleased, retrieved.Released)
}

func TestCreateEvent(t *testing.T) {
	db := setupTestDB(t)

	event := &models.VestingEvent{
		EventType:       "VestingScheduleCreated",
		Beneficiary:     "0xF25DA65784D566fFCC60A1f113650afB688A14ED",
		Amount:          "1000000000000000000000",
		BlockNumber:     12345678,
		TransactionHash: "0xabcdef1234567890",
		Timestamp:       time.Now(),
	}

	err := db.CreateEvent(event)
	assert.NoError(t, err)

	// Retrieve events
	events, err := db.GetEventsByBeneficiary(event.Beneficiary, 10, 0)
	assert.NoError(t, err)
	assert.Len(t, events, 1)
	assert.Equal(t, event.EventType, events[0].EventType)
}

func TestGetEventsByBeneficiary(t *testing.T) {
	db := setupTestDB(t)

	beneficiary := "0xF25DA65784D566fFCC60A1f113650afB688A14ED"

	// Create multiple events
	eventTypes := []string{"VestingScheduleCreated", "TokensReleased", "TokensReleased"}
	for i, eventType := range eventTypes {
		event := &models.VestingEvent{
			EventType:       eventType,
			Beneficiary:     beneficiary,
			Amount:          "1000000000000000000000",
			BlockNumber:     uint64(12345678 + i),
			TransactionHash: "0xabcdef123456789" + string('0'+rune(i)),
			Timestamp:       time.Now().Add(time.Duration(i) * time.Hour),
		}
		err := db.CreateEvent(event)
		assert.NoError(t, err)
	}

	// Test retrieval
	events, err := db.GetEventsByBeneficiary(beneficiary, 10, 0)
	assert.NoError(t, err)
	assert.Len(t, events, 3)

	// Events should be ordered by block_number DESC
	assert.True(t, events[0].BlockNumber >= events[1].BlockNumber)
}

func TestGetLastProcessedBlock(t *testing.T) {
	db := setupTestDB(t)

	// Test with no events
	block, err := db.GetLastProcessedBlock()
	assert.NoError(t, err)
	assert.Equal(t, uint64(0), block)

	// Create events
	for i := 1; i <= 3; i++ {
		event := &models.VestingEvent{
			EventType:       "TokensReleased",
			Beneficiary:     "0xF25DA65784D566fFCC60A1f113650afB688A14ED",
			Amount:          "1000000000000000000000",
			BlockNumber:     uint64(i * 1000),
			TransactionHash: "0xabcdef123456789" + string('0'+rune(i)),
			Timestamp:       time.Now(),
		}
		err := db.CreateEvent(event)
		assert.NoError(t, err)
	}

	// Get last processed block
	block, err = db.GetLastProcessedBlock()
	assert.NoError(t, err)
	assert.Equal(t, uint64(3000), block)
}
