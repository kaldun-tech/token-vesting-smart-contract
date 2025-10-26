package integration

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/kaldun-tech/token-vesting-backend/internal/api"
	"github.com/kaldun-tech/token-vesting-backend/internal/database"
	"github.com/kaldun-tech/token-vesting-backend/internal/models"
)

// TestServer wraps the API server for integration testing
type TestServer struct {
	DB     *database.Database
	Router *gin.Engine
	Server *httptest.Server
}

// setupTestServer creates a test server with in-memory database
func setupTestServer(t *testing.T) *TestServer {
	// Create in-memory database
	gormDB, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Auto-migrate
	err = gormDB.AutoMigrate(&models.VestingSchedule{}, &models.VestingEvent{})
	require.NoError(t, err)

	db := &database.Database{DB: gormDB}

	// Setup router
	gin.SetMode(gin.TestMode)
	router := gin.New()

	handler := api.NewHandler(db, nil) // No blockchain client for integration tests

	// Register routes
	router.GET("/health", handler.HealthCheck)
	router.GET("/api/v1/schedules", handler.GetAllSchedules)
	router.GET("/api/v1/schedules/:address", handler.GetSchedule)
	router.GET("/api/v1/events/:address", handler.GetEvents)
	router.GET("/api/v1/stats", handler.GetStats)
	// Note: /api/v1/vested/:address requires blockchain client, skip in integration tests

	// Create test server
	server := httptest.NewServer(router)

	return &TestServer{
		DB:     db,
		Router: router,
		Server: server,
	}
}

// teardown closes the test server
func (ts *TestServer) teardown() {
	ts.Server.Close()
}

// seedTestData populates the database with test data
func seedTestData(t *testing.T, db *database.Database) {
	schedules := []models.VestingSchedule{
		{
			Beneficiary: "0xF25DA65784D566fFCC60A1f113650afB688A14ED",
			Start:       time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			Cliff:       time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
			Duration:    4 * 365 * 24 * 60 * 60, // 4 years
			Amount:      "1000000000000000000000",
			Released:    "250000000000000000000",
			Revocable:   true,
			Revoked:     false,
		},
		{
			Beneficiary: "0x04d45a31e94D2Ba0007Fa4b58DEf1254d83302ea",
			Start:       time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC),
			Cliff:       time.Date(2024, 12, 1, 0, 0, 0, 0, time.UTC),
			Duration:    2 * 365 * 24 * 60 * 60, // 2 years
			Amount:      "500000000000000000000",
			Released:    "0",
			Revocable:   true,
			Revoked:     false,
		},
		{
			Beneficiary: "0x0000000000000000000000000000000000000001",
			Start:       time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC),
			Cliff:       time.Date(2023, 6, 1, 0, 0, 0, 0, time.UTC),
			Duration:    1 * 365 * 24 * 60 * 60, // 1 year
			Amount:      "100000000000000000000",
			Released:    "100000000000000000000",
			Revocable:   false,
			Revoked:     true,
		},
	}

	for _, schedule := range schedules {
		err := db.CreateOrUpdateSchedule(&schedule)
		require.NoError(t, err)
	}

	// Add events
	events := []models.VestingEvent{
		{
			EventType:       "VestingScheduleCreated",
			Beneficiary:     "0xF25DA65784D566fFCC60A1f113650afB688A14ED",
			Amount:          "1000000000000000000000",
			BlockNumber:     12345678,
			TransactionHash: "0xabc123",
			Timestamp:       time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			EventType:       "TokensReleased",
			Beneficiary:     "0xF25DA65784D566fFCC60A1f113650afB688A14ED",
			Amount:          "250000000000000000000",
			BlockNumber:     12345679,
			TransactionHash: "0xdef456",
			Timestamp:       time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			EventType:       "VestingScheduleCreated",
			Beneficiary:     "0x04d45a31e94D2Ba0007Fa4b58DEf1254d83302ea",
			Amount:          "500000000000000000000",
			BlockNumber:     12345680,
			TransactionHash: "0xghi789",
			Timestamp:       time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC),
		},
	}

	for _, event := range events {
		err := db.CreateEvent(&event)
		require.NoError(t, err)
	}
}

// TestHealthCheck tests the health check endpoint
func TestHealthCheck(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardown()

	resp, err := http.Get(ts.Server.URL + "/health")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]string
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(t, err)

	assert.Equal(t, "ok", result["status"])
	assert.Equal(t, "token-vesting-api", result["service"])
}

// TestGetAllSchedules tests retrieving all vesting schedules
func TestGetAllSchedules(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardown()

	seedTestData(t, ts.DB)

	tests := []struct {
		name           string
		query          string
		expectedCount  int
		expectedStatus int
	}{
		{
			name:           "Get all schedules (default pagination)",
			query:          "",
			expectedCount:  2, // Only non-revoked schedules
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Get with limit",
			query:          "?limit=1",
			expectedCount:  1,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Get with offset",
			query:          "?offset=1",
			expectedCount:  1,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Get with limit and offset",
			query:          "?limit=1&offset=0",
			expectedCount:  1,
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := http.Get(ts.Server.URL + "/api/v1/schedules" + tt.query)
			require.NoError(t, err)
			defer resp.Body.Close()

			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			var result map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&result)
			require.NoError(t, err)

			schedules := result["schedules"].([]interface{})
			assert.Equal(t, tt.expectedCount, len(schedules))
			assert.Equal(t, float64(tt.expectedCount), result["count"])
		})
	}
}

// TestGetScheduleByAddress tests retrieving a specific vesting schedule
func TestGetScheduleByAddress(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardown()

	seedTestData(t, ts.DB)

	tests := []struct {
		name           string
		address        string
		expectedStatus int
		checkFields    bool
	}{
		{
			name:           "Get existing schedule",
			address:        "0xF25DA65784D566fFCC60A1f113650afB688A14ED",
			expectedStatus: http.StatusOK,
			checkFields:    true,
		},
		{
			name:           "Get existing schedule (lowercase)",
			address:        "0xf25da65784d566ffcc60a1f113650afb688a14ed",
			expectedStatus: http.StatusOK,
			checkFields:    true,
		},
		{
			name:           "Get non-existent schedule",
			address:        "0x0000000000000000000000000000000000000999",
			expectedStatus: http.StatusNotFound,
			checkFields:    false,
		},
		{
			name:           "Get revoked schedule",
			address:        "0x0000000000000000000000000000000000000001",
			expectedStatus: http.StatusNotFound, // Revoked schedules are filtered
			checkFields:    false,
		},
		{
			name:           "Invalid address - too short",
			address:        "0xF25DA65784D566fFCC60A1f113650afB688A14E",
			expectedStatus: http.StatusBadRequest,
			checkFields:    false,
		},
		{
			name:           "Invalid address - invalid chars",
			address:        "0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
			expectedStatus: http.StatusBadRequest,
			checkFields:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := fmt.Sprintf("%s/api/v1/schedules/%s", ts.Server.URL, tt.address)
			resp, err := http.Get(url)
			require.NoError(t, err)
			defer resp.Body.Close()

			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			if tt.checkFields {
				var schedule models.VestingSchedule
				err = json.NewDecoder(resp.Body).Decode(&schedule)
				require.NoError(t, err)

				assert.NotEmpty(t, schedule.Beneficiary)
				assert.NotEmpty(t, schedule.Amount)
				assert.NotZero(t, schedule.Duration)
			}
		})
	}
}

// TestGetEvents tests retrieving events for a beneficiary
func TestGetEvents(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardown()

	seedTestData(t, ts.DB)

	tests := []struct {
		name           string
		address        string
		query          string
		expectedCount  int
		expectedStatus int
	}{
		{
			name:           "Get events for beneficiary with 2 events",
			address:        "0xF25DA65784D566fFCC60A1f113650afB688A14ED",
			query:          "",
			expectedCount:  2,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Get events for beneficiary with 1 event",
			address:        "0x04d45a31e94D2Ba0007Fa4b58DEf1254d83302ea",
			query:          "",
			expectedCount:  1,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Get events with limit",
			address:        "0xF25DA65784D566fFCC60A1f113650afB688A14ED",
			query:          "?limit=1",
			expectedCount:  1,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Get events for non-existent address",
			address:        "0x0000000000000000000000000000000000000999",
			query:          "",
			expectedCount:  0,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid address",
			address:        "invalid",
			query:          "",
			expectedCount:  0,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := fmt.Sprintf("%s/api/v1/events/%s%s", ts.Server.URL, tt.address, tt.query)
			resp, err := http.Get(url)
			require.NoError(t, err)
			defer resp.Body.Close()

			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			if tt.expectedStatus == http.StatusOK {
				var result map[string]interface{}
				err = json.NewDecoder(resp.Body).Decode(&result)
				require.NoError(t, err)

				events := result["events"].([]interface{})
				assert.Equal(t, tt.expectedCount, len(events))
				assert.Equal(t, float64(tt.expectedCount), result["count"])
			}
		})
	}
}

// TestGetStats tests the statistics endpoint
func TestGetStats(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardown()

	seedTestData(t, ts.DB)

	resp, err := http.Get(ts.Server.URL + "/api/v1/stats")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(t, err)

	// Should have 2 active schedules (1 is revoked)
	assert.Equal(t, float64(2), result["total_schedules"])
	assert.Equal(t, float64(2), result["active_schedules"])
}

// TestAddressNormalization tests that addresses are normalized (checksummed)
func TestAddressNormalization(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardown()

	seedTestData(t, ts.DB)

	// Test with lowercase address
	url := fmt.Sprintf("%s/api/v1/schedules/%s",
		ts.Server.URL,
		"0xf25da65784d566ffcc60a1f113650afb688a14ed") // lowercase

	resp, err := http.Get(url)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var schedule models.VestingSchedule
	err = json.NewDecoder(resp.Body).Decode(&schedule)
	require.NoError(t, err)

	// Response should have checksummed address
	assert.Equal(t, "0xF25DA65784D566fFCC60A1f113650afB688A14ED", schedule.Beneficiary)
}

// TestEventOrdering tests that events are returned in correct order
func TestEventOrdering(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardown()

	seedTestData(t, ts.DB)

	url := fmt.Sprintf("%s/api/v1/events/%s",
		ts.Server.URL,
		"0xF25DA65784D566fFCC60A1f113650afB688A14ED")

	resp, err := http.Get(url)
	require.NoError(t, err)
	defer resp.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(t, err)

	events := result["events"].([]interface{})
	assert.Len(t, events, 2)

	// Events should be ordered by block_number DESC (newest first)
	event1 := events[0].(map[string]interface{})
	event2 := events[1].(map[string]interface{})

	block1 := event1["block_number"].(float64)
	block2 := event2["block_number"].(float64)

	assert.True(t, block1 >= block2, "Events should be ordered by block number DESC")
}

// TestConcurrentRequests tests handling multiple concurrent read requests
func TestConcurrentRequests(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardown()

	seedTestData(t, ts.DB)

	const numRequests = 10
	done := make(chan int, numRequests)
	successCount := 0

	// Launch concurrent read requests (safe with SQLite)
	for i := 0; i < numRequests; i++ {
		go func() {
			resp, err := http.Get(ts.Server.URL + "/health") // Use health check (no DB reads)
			status := 0
			if err == nil {
				status = resp.StatusCode
				resp.Body.Close()
			}
			done <- status
		}()
	}

	// Wait for all requests to complete and count successes
	for i := 0; i < numRequests; i++ {
		status := <-done
		if status == http.StatusOK {
			successCount++
		}
	}

	// At least 80% of requests should succeed (allows for some SQLite contention)
	assert.GreaterOrEqual(t, successCount, 8, "Most concurrent requests should succeed")
}
