package database

import (
	"fmt"
	"log"

	"github.com/yourusername/token-vesting-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	DB *gorm.DB
}

// NewDatabase creates a new database connection
func NewDatabase(databaseURL string) (*Database, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto-migrate the schema
	if err := db.AutoMigrate(
		&models.VestingSchedule{},
		&models.VestingEvent{},
	); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate database: %w", err)
	}

	log.Println("✅ Database connected and migrated successfully")

	return &Database{DB: db}, nil
}

// GetScheduleByBeneficiary retrieves a vesting schedule by beneficiary address
func (d *Database) GetScheduleByBeneficiary(beneficiary string) (*models.VestingSchedule, error) {
	var schedule models.VestingSchedule
	result := d.DB.Where("beneficiary = ? AND revoked = ?", beneficiary, false).First(&schedule)
	if result.Error != nil {
		return nil, result.Error
	}
	return &schedule, nil
}

// GetAllSchedules retrieves all active vesting schedules
func (d *Database) GetAllSchedules(limit, offset int) ([]models.VestingSchedule, error) {
	var schedules []models.VestingSchedule
	result := d.DB.Where("revoked = ?", false).Limit(limit).Offset(offset).Find(&schedules)
	if result.Error != nil {
		return nil, result.Error
	}
	return schedules, nil
}

// CreateOrUpdateSchedule creates or updates a vesting schedule
func (d *Database) CreateOrUpdateSchedule(schedule *models.VestingSchedule) error {
	var existing models.VestingSchedule
	result := d.DB.Where("beneficiary = ?", schedule.Beneficiary).First(&existing)

	if result.Error == gorm.ErrRecordNotFound {
		// Create new schedule
		return d.DB.Create(schedule).Error
	}

	// Update existing schedule
	return d.DB.Model(&existing).Updates(schedule).Error
}

// CreateEvent creates a new vesting event
func (d *Database) CreateEvent(event *models.VestingEvent) error {
	return d.DB.Create(event).Error
}

// GetEventsByBeneficiary retrieves all events for a beneficiary
func (d *Database) GetEventsByBeneficiary(beneficiary string, limit, offset int) ([]models.VestingEvent, error) {
	var events []models.VestingEvent
	result := d.DB.Where("beneficiary = ?", beneficiary).
		Order("block_number DESC").
		Limit(limit).
		Offset(offset).
		Find(&events)
	if result.Error != nil {
		return nil, result.Error
	}
	return events, nil
}

// GetLastProcessedBlock gets the highest block number we've processed
func (d *Database) GetLastProcessedBlock() (uint64, error) {
	var event models.VestingEvent
	result := d.DB.Order("block_number DESC").First(&event)
	if result.Error == gorm.ErrRecordNotFound {
		return 0, nil
	}
	if result.Error != nil {
		return 0, result.Error
	}
	return event.BlockNumber, nil
}

// MarkScheduleAsRevoked marks a schedule as revoked
func (d *Database) MarkScheduleAsRevoked(beneficiary string) error {
	return d.DB.Model(&models.VestingSchedule{}).
		Where("beneficiary = ?", beneficiary).
		Update("revoked", true).Error
}

// UpdateReleased updates the released amount for a schedule
func (d *Database) UpdateReleased(beneficiary string, released string) error {
	return d.DB.Model(&models.VestingSchedule{}).
		Where("beneficiary = ?", beneficiary).
		Update("released", released).Error
}
