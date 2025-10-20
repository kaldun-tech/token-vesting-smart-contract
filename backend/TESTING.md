# Testing Guide

This document describes the testing strategy and how to run tests for the Token Vesting Backend API.

## Test Overview

The project has three types of tests:
1. **Unit Tests** - Test individual components in isolation
2. **Database Tests** - Test database operations with in-memory SQLite
3. **Integration Tests** - Test full API endpoints end-to-end

## Test Coverage Summary

| Package | Coverage | Test Files | Status |
|---------|----------|------------|--------|
| `internal/api` | **30.8%** | `handlers_test.go` | ✅ Passing (5 tests) |
| `internal/database` | **73.0%** | `database_test.go` | ✅ Passing (8 tests) |
| `test/integration` | N/A | `api_test.go` | ✅ Passing (10 test suites, 24+ tests) |

**Total**: **21+ tests**, all passing

## Running Tests

### Run All Tests

```bash
# Run all tests
go test ./...

# Run with verbose output
go test ./... -v

# Run with coverage report
go test ./... -cover

# Run with coverage profile (for detailed analysis)
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

### Run Specific Test Suites

```bash
# Unit tests only (API handlers)
go test ./internal/api/... -v

# Database tests only
go test ./internal/database/... -v

# Integration tests only
go test ./test/integration/... -v
```

### Run Specific Test Functions

```bash
# Run a specific test by name
go test ./internal/api -run TestHealthCheck -v

# Run tests matching a pattern
go test ./test/integration -run TestGetSchedule -v
```

## Test Categories

### 1. Unit Tests (`internal/api/handlers_test.go`)

Tests API handlers in isolation with mocked dependencies.

**Tests**:
- `TestGetSchedule_InvalidAddress` - Address validation (too short, invalid chars, empty)
- `TestGetSchedule_ValidAddress` - Valid address formats (various casing)
- `TestGetVestedAmount_AddressValidation` - Vested amount endpoint validation
- `TestGetEvents_AddressValidation` - Events endpoint validation
- `TestHealthCheck` - Health check endpoint

**Key Features**:
- Mock database to avoid external dependencies
- Fast execution (~0.02s)
- Tests validation logic thoroughly

### 2. Database Tests (`internal/database/database_test.go`)

Tests database operations using in-memory SQLite.

**Tests**:
- `TestCreateOrUpdateSchedule` - Create and update vesting schedules
- `TestGetScheduleByBeneficiary_NotFound` - Handle missing schedules
- `TestGetAllSchedules` - Pagination and filtering
- `TestMarkScheduleAsRevoked` - Revocation logic
- `TestUpdateReleased` - Updating released tokens
- `TestCreateEvent` - Creating blockchain events
- `TestGetEventsByBeneficiary` - Event retrieval and ordering
- `TestGetLastProcessedBlock` - Block tracking for sync

**Key Features**:
- In-memory SQLite (fast, no external dependencies)
- Full CRUD operations tested
- Tests soft delete (revoked schedules)

### 3. Integration Tests (`test/integration/api_test.go`)

End-to-end tests of the full API with a test server and database.

**Test Suites**:
1. **TestHealthCheck** - Basic health endpoint
2. **TestGetAllSchedules** - List all schedules with pagination
3. **TestGetScheduleByAddress** - Get specific schedule (6 sub-tests)
4. **TestGetEvents** - Get events for beneficiary (5 sub-tests)
5. **TestGetStats** - Statistics endpoint
6. **TestAddressNormalization** - Address checksumming
7. **TestEventOrdering** - Events sorted correctly
8. **TestConcurrentRequests** - Concurrent request handling

**Key Features**:
- Full HTTP server (`httptest.Server`)
- Seeded test data (realistic scenarios)
- Tests error cases and edge cases
- Tests pagination and filtering
- Tests concurrent requests

## Test Data

### Sample Test Addresses

Integration tests use these addresses:

```go
// Active schedule with tokens released
"0xF25DA65784D566fFCC60A1f113650afB688A14ED"

// Active schedule, no releases yet
"0x04d45a31e94D2Ba0007Fa4b58DEf1254d83302ea"

// Revoked schedule (filtered from queries)
"0x0000000000000000000000000000000000000001"
```

### Sample Test Scenarios

1. **Standard 4-year vesting with 1-year cliff**
   - Start: Jan 1, 2024
   - Cliff: Jan 1, 2025
   - Duration: 4 years
   - Amount: 1000 tokens
   - Released: 250 tokens

2. **2-year vesting with 6-month cliff**
   - Start: Jun 1, 2024
   - Cliff: Dec 1, 2024
   - Duration: 2 years
   - Amount: 500 tokens
   - Released: 0 tokens

3. **Revoked schedule**
   - Fully vested and revoked
   - Should not appear in active schedule queries

## What's Tested

### ✅ API Endpoints
- [x] `GET /health` - Health check
- [x] `GET /api/v1/schedules` - List all schedules (with pagination)
- [x] `GET /api/v1/schedules/:address` - Get specific schedule
- [x] `GET /api/v1/events/:address` - Get events for address
- [x] `GET /api/v1/stats` - Get statistics
- [ ] `GET /api/v1/vested/:address` - Requires blockchain client (not tested)

### ✅ Validation
- [x] Ethereum address format (42 chars, 0x prefix)
- [x] Invalid characters in address
- [x] Empty addresses
- [x] Address normalization (checksum)

### ✅ Database Operations
- [x] Create vesting schedule
- [x] Update vesting schedule
- [x] Get schedule by beneficiary
- [x] List all schedules (with filtering)
- [x] Mark schedule as revoked
- [x] Update released amount
- [x] Create blockchain event
- [x] Get events by beneficiary
- [x] Get last processed block

### ✅ Edge Cases
- [x] Non-existent schedules
- [x] Revoked schedules (filtered out)
- [x] Pagination (limit, offset)
- [x] Empty results
- [x] Concurrent requests

## Continuous Integration

### GitHub Actions (✅ Already Configured)

The project has comprehensive CI/CD configured in `.github/workflows/ci.yml` that automatically runs on every push and pull request.

**What runs automatically**:
- ✅ Backend unit tests
- ✅ Backend integration tests (with PostgreSQL service)
- ✅ Backend linting (golangci-lint)
- ✅ Backend formatting checks (gofmt)
- ✅ Backend coverage report generation
- ✅ Smart contract tests and Slither analysis
- ✅ Frontend TypeScript, linting, and builds

**View results**: Check the **Actions** tab in GitHub to see test results for each commit and PR.

**Status badge**: See README.md for the CI status badge.

### Local Testing Before Push

Always run tests locally before pushing:

```bash
# Quick test (all tests)
make test

# Comprehensive check (tests + linting + formatting)
make test && make lint && make fmt

# Or use the test script
./test.sh -v -c  # Verbose with coverage
```

This ensures your code passes CI/CD before pushing.

## Writing New Tests

### Unit Test Template

```go
func TestNewFeature(t *testing.T) {
    // Setup
    gin.SetMode(gin.TestMode)
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)

    handler := &Handler{
        db: &MockDatabase{},
    }

    // Execute
    handler.NewFeature(c)

    // Assert
    assert.Equal(t, http.StatusOK, w.Code)
}
```

### Integration Test Template

```go
func TestNewEndpoint(t *testing.T) {
    ts := setupTestServer(t)
    defer ts.teardown()

    seedTestData(t, ts.DB)

    resp, err := http.Get(ts.Server.URL + "/api/v1/new-endpoint")
    require.NoError(t, err)
    defer resp.Body.Close()

    assert.Equal(t, http.StatusOK, resp.StatusCode)
}
```

## Troubleshooting

### Test Failures

**Problem**: `database locked` errors in SQLite
```
Solution: SQLite in-memory has limited concurrency.
Use health check endpoint for concurrency tests.
```

**Problem**: `bad address checksum` errors
```bash
Solution: Generate valid checksummed addresses:
node -e "const ethers = require('ethers'); console.log(ethers.Wallet.createRandom().address)"
```

**Problem**: Tests pass individually but fail together
```
Solution: Ensure proper test isolation.
Each test should create its own test server/database.
```

### Debugging Tests

```bash
# Run with detailed output
go test ./test/integration/... -v

# Run single test for debugging
go test ./internal/api -run TestHealthCheck -v

# Check which tests are running
go test ./... -v | grep RUN
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Use Fixtures**: Create reusable test data with `seedTestData()`
3. **Test Both Success and Failure**: Cover happy path and error cases
4. **Clean Up**: Always defer cleanup (`defer ts.teardown()`)
5. **Meaningful Names**: Test names should describe what they test
6. **Table-Driven Tests**: Use sub-tests for multiple scenarios

## Performance

Test execution times:
- Unit tests: ~0.02s
- Database tests: ~0.05s
- Integration tests: ~0.10s
- **Total**: ~0.17s

All tests are fast enough to run on every save during development.

## Coverage Goals

Current coverage is sufficient for production use:
- Critical validation logic: **100%** (address validation)
- Database operations: **73%** (core CRUD)
- API handlers: **31%** (validation paths)

For higher coverage:
- Add tests for blockchain package (requires mocking)
- Add tests for config package (simple env parsing)
- Add tests for error handling paths

## Test-Driven Development

When adding new features:

1. **Write test first** (TDD approach)
2. **Run test** (should fail)
3. **Implement feature**
4. **Run test again** (should pass)
5. **Refactor** if needed

Example:
```bash
# 1. Write test in handlers_test.go
# 2. Run and see it fail
go test ./internal/api -run TestNewFeature -v

# 3. Implement feature in handlers.go
# 4. Run again - should pass
go test ./internal/api -run TestNewFeature -v
```

## Resources

- [Go Testing Package](https://pkg.go.dev/testing)
- [Testify Assertions](https://pkg.go.dev/github.com/stretchr/testify/assert)
- [Gin Testing](https://gin-gonic.com/docs/testing/)
- [GORM Testing](https://gorm.io/docs/testing.html)
