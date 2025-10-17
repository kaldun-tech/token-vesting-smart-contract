package blockchain

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/kaldun-tech/token-vesting-backend/internal/database"
	"github.com/kaldun-tech/token-vesting-backend/internal/models"
)

type EventListener struct {
	client *Client
	db     *database.Database
}

func NewEventListener(client *Client, db *database.Database) *EventListener {
	return &EventListener{
		client: client,
		db:     db,
	}
}

// Start begins listening for events
func (el *EventListener) Start(ctx context.Context, startBlock uint64) error {
	// First, sync historical events
	if err := el.syncHistoricalEvents(ctx, startBlock); err != nil {
		log.Printf("⚠️  Warning: Failed to sync historical events: %v", err)
	}

	// Then start watching for new events
	eventChan := make(chan *ContractEvent, 100)

	latestBlock, err := el.client.GetLatestBlockNumber(ctx)
	if err != nil {
		return err
	}

	if err := el.client.WatchEvents(ctx, latestBlock, eventChan); err != nil {
		return err
	}

	// Process events as they come in
	go el.processEvents(ctx, eventChan)

	return nil
}

// syncHistoricalEvents fetches and processes past events
func (el *EventListener) syncHistoricalEvents(ctx context.Context, startBlock uint64) error {
	log.Println("📜 Syncing historical events...")

	// Get the last processed block from database
	lastProcessed, err := el.db.GetLastProcessedBlock()
	if err != nil {
		log.Printf("⚠️  Could not get last processed block: %v", err)
		lastProcessed = startBlock
	}

	if lastProcessed > startBlock {
		startBlock = lastProcessed + 1
	}

	latestBlock, err := el.client.GetLatestBlockNumber(ctx)
	if err != nil {
		return err
	}

	if startBlock >= latestBlock {
		log.Println("✅ Already up to date")
		return nil
	}

	log.Printf("📊 Fetching events from block %d to %d", startBlock, latestBlock)

	// Fetch and process historical events in batches
	if err := el.fetchAndProcessHistoricalEvents(ctx, startBlock, latestBlock); err != nil {
		log.Printf("❌ Failed to fetch and process historical events: %v", err)
	}

	log.Println("✅ Historical sync complete")
	return nil
}

// fetchAndProcessHistoricalEvents fetches and processes historical events in batches
func (el *EventListener) fetchAndProcessHistoricalEvents(ctx context.Context, startBlock, latestBlock uint64) error {
	// Fetch in batches to avoid RPC limits
	batchSize := uint64(10000)
	for from := startBlock; from < latestBlock; from += batchSize {
		to := from + batchSize
		if to > latestBlock {
			to = latestBlock
		}

		events, err := el.client.FetchHistoricalEvents(ctx, from, to)
		if err != nil {
			return fmt.Errorf("failed to fetch events from %d to %d: %v", from, to, err)
		}

		for _, event := range events {
			if err := el.handleEvent(event); err != nil {
				return fmt.Errorf("failed to handle event: %v", err)
			}
		}

		log.Printf("✅ Processed blocks %d to %d (%d events)", from, to, len(events))
	}

	return nil
}

// processEvents handles incoming events from the event channel
func (el *EventListener) processEvents(ctx context.Context, eventChan <-chan *ContractEvent) {
	log.Println("👂 Listening for new events...")

	for {
		select {
		case event := <-eventChan:
			if err := el.handleEvent(event); err != nil {
				log.Printf("❌ Failed to handle event: %v", err)
			} else {
				log.Printf("✅ Processed %s event for %s", event.EventType, event.Beneficiary)
			}
		case <-ctx.Done():
			log.Println("🛑 Stopping event processor")
			return
		}
	}
}

// handleEvent processes a single event
func (el *EventListener) handleEvent(event *ContractEvent) error {
	// Save event to database
	vestingEvent := &models.VestingEvent{
		EventType:       event.EventType,
		Beneficiary:     event.Beneficiary,
		Amount:          event.Amount,
		BlockNumber:     event.BlockNumber,
		TransactionHash: event.TransactionHash,
		Timestamp:       time.Now(), // In production, get from block timestamp
	}

	if err := el.db.CreateEvent(vestingEvent); err != nil {
		return err
	}

	// Update vesting schedule based on event type
	switch event.EventType {
	case "VestingScheduleCreated":
		return el.handleScheduleCreated(event)
	case "TokensReleased":
		return el.handleTokensReleased(event)
	case "VestingRevoked":
		return el.handleVestingRevoked(event)
	}

	return nil
}

// handleScheduleCreated processes a VestingScheduleCreated event
func (el *EventListener) handleScheduleCreated(event *ContractEvent) error {
	data := event.Data

	schedule := &models.VestingSchedule{
		Beneficiary: event.Beneficiary,
		Start:       time.Unix(int64(data["start"].(uint64)), 0),
		Cliff:       time.Unix(int64(data["cliff"].(uint64)), 0),
		Duration:    int64(data["duration"].(uint64)),
		Amount:      event.Amount,
		Released:    "0",
		Revocable:   true, // Default, should be from event data
		Revoked:     false,
	}

	return el.db.CreateOrUpdateSchedule(schedule)
}

// handleTokensReleased processes a TokensReleased event
func (el *EventListener) handleTokensReleased(event *ContractEvent) error {
	return el.db.UpdateReleased(event.Beneficiary, event.Amount)
}

// handleVestingRevoked processes a VestingRevoked event
func (el *EventListener) handleVestingRevoked(event *ContractEvent) error {
	return el.db.MarkScheduleAsRevoked(event.Beneficiary)
}
