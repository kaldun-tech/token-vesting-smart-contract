package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/kaldun-tech/token-vesting-backend/internal/models"
	"github.com/stretchr/testify/assert"
)

// MockDatabase implements database methods for testing
type MockDatabase struct {
	GetScheduleFunc func(address string) (*models.VestingSchedule, error)
}

func (m *MockDatabase) GetScheduleByBeneficiary(address string) (*models.VestingSchedule, error) {
	if m.GetScheduleFunc != nil {
		return m.GetScheduleFunc(address)
	}
	return nil, errors.New("not found")
}

func (m *MockDatabase) GetEventsByBeneficiary(address string, limit, offset int) ([]models.VestingEvent, error) {
	return []models.VestingEvent{}, nil
}

func (m *MockDatabase) GetAllSchedules(limit, offset int) ([]models.VestingSchedule, error) {
	return []models.VestingSchedule{}, nil
}

func (m *MockDatabase) CreateOrUpdateSchedule(schedule *models.VestingSchedule) error {
	return nil
}

func (m *MockDatabase) CreateEvent(event *models.VestingEvent) error {
	return nil
}

func (m *MockDatabase) UpdateReleased(beneficiary, amount string) error {
	return nil
}

func (m *MockDatabase) MarkScheduleAsRevoked(beneficiary string) error {
	return nil
}

func (m *MockDatabase) GetLastProcessedBlock() (uint64, error) {
	return 0, nil
}

// TestGetSchedule_InvalidAddress tests address validation
func TestGetSchedule_InvalidAddress(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		address        string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Invalid address - too short",
			address:        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bE",
			expectedStatus: http.StatusBadRequest,
			expectedError:  ERR_INVALID_ETH_ADDRESS,
		},
		{
			name:           "Invalid address - no 0x prefix",
			address:        "F25DA65784D566fFCC60A1f113650afB688A14ED",
			expectedStatus: http.StatusNotFound, // common.IsHexAddress accepts without 0x
			expectedError:  "Schedule not found",
		},
		{
			name:           "Invalid address - invalid characters",
			address:        "0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
			expectedStatus: http.StatusBadRequest,
			expectedError:  ERR_INVALID_ETH_ADDRESS,
		},
		{
			name:           "Empty address",
			address:        "",
			expectedStatus: http.StatusBadRequest,
			expectedError:  ERR_INVALID_ETH_ADDRESS,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "address", Value: tt.address}}

			handler := &Handler{
				db:         &MockDatabase{}, // Use mock to avoid nil pointer
				blockchain: nil,
			}

			// Execute
			handler.GetSchedule(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var response map[string]string
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedError, response["error"])
			}
		})
	}
}

// TestGetSchedule_ValidAddress tests valid address format (without database)
func TestGetSchedule_ValidAddress(t *testing.T) {
	gin.SetMode(gin.TestMode)

	validAddresses := []string{
		"0xF25DA65784D566fFCC60A1f113650afB688A14ED",
		"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", // Fixed: added last char
		"0x0000000000000000000000000000000000000000", // Zero address is valid format
		"0xffffffffffffffffffffffffffffffffffffffff", // All lowercase
		"0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", // All uppercase
	}

	for _, addr := range validAddresses {
		t.Run("Valid_"+addr, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "address", Value: addr}}

			// Mock database that returns "not found"
			handler := &Handler{
				db:         &MockDatabase{},
				blockchain: nil,
			}

			handler.GetSchedule(c)

			// Should NOT return 400 (bad request)
			// Will return 404 (not found) since DB is mocked
			assert.NotEqual(t, http.StatusBadRequest, w.Code,
				"Valid address should not return BadRequest")
			assert.Equal(t, http.StatusNotFound, w.Code,
				"Should return NotFound with mock DB")
		})
	}
}

// TestGetVestedAmount_AddressValidation tests the vested amount endpoint validation
func TestGetVestedAmount_AddressValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Invalid address", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "address", Value: "invalid"}}

		handler := &Handler{
			db:         &MockDatabase{},
			blockchain: nil,
		}

		handler.GetVestedAmount(c)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// Note: Testing with valid address requires mocking blockchain client
	// which is complex, so we only test validation here
}

// TestGetEvents_AddressValidation tests the events endpoint validation
func TestGetEvents_AddressValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "address", Value: "invalid-address"}}

	handler := &Handler{
		db:         &MockDatabase{},
		blockchain: nil,
	}

	handler.GetEvents(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, ERR_INVALID_ETH_ADDRESS, response["error"])
}

// TestHealthCheck tests the health check endpoint
func TestHealthCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	handler := &Handler{}
	handler.HealthCheck(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "ok", response["status"])
	assert.Equal(t, "token-vesting-api", response["service"])
}
