package models

import (
	"time"

	"gorm.io/gorm"
)

// VestingSchedule represents a vesting schedule stored in the database
type VestingSchedule struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Beneficiary string         `gorm:"index;not null;size:42" json:"beneficiary"` // Ethereum address
	Start       time.Time      `json:"start"`
	Cliff       time.Time      `json:"cliff"`
	Duration    int64          `json:"duration"` // Duration in seconds
	Amount      string         `json:"amount"`   // Store as string to handle big numbers
	Released    string         `json:"released"` // Store as string to handle big numbers
	Revocable   bool           `json:"revocable"`
	Revoked     bool           `json:"revoked"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// VestingEvent represents blockchain events
type VestingEvent struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	EventType       string    `gorm:"index;not null" json:"event_type"` // VestingScheduleCreated, TokensReleased, VestingRevoked
	Beneficiary     string    `gorm:"index;not null;size:42" json:"beneficiary"`
	Amount          string    `json:"amount"`
	BlockNumber     uint64    `gorm:"index" json:"block_number"`
	TransactionHash string    `gorm:"uniqueIndex;not null;size:66" json:"transaction_hash"`
	Timestamp       time.Time `json:"timestamp"`
	CreatedAt       time.Time `json:"created_at"`
}

// BeneficiaryStats represents aggregated statistics for a beneficiary
type BeneficiaryStats struct {
	Beneficiary     string    `json:"beneficiary"`
	TotalVested     string    `json:"total_vested"`
	TotalReleased   string    `json:"total_released"`
	TotalPending    string    `json:"total_pending"`
	ScheduleCount   int       `json:"schedule_count"`
	LastReleaseDate time.Time `json:"last_release_date,omitempty"`
}

// TableName overrides the table name
func (VestingSchedule) TableName() string {
	return "vesting_schedules"
}

func (VestingEvent) TableName() string {
	return "vesting_events"
}
