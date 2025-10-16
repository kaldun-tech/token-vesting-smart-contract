# Backend Architecture

## Overview

The Token Vesting Backend is a Go-based REST API that provides read access to blockchain vesting data with automatic event synchronization to a PostgreSQL database.

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | Go 1.21+ | High-performance, concurrent |
| **Web Framework** | Gin | Fast HTTP routing |
| **Database** | PostgreSQL 14+ | Persistent storage |
| **ORM** | GORM | Database abstraction |
| **Blockchain** | go-ethereum | Ethereum interaction |
| **Network** | Base Sepolia L2 | EVM-compatible L2 |

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                    │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌──────────────────────────────────────────────────────────┐
│                    API Server (Gin)                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐       │
│  │  Handlers  │  │   Router   │  │    CORS     │       │
│  └────────────┘  └────────────┘  └─────────────┘       │
└──────────┬────────────────┬──────────────────────────────┘
           │                │
           │ Read/Write     │ Read
           ▼                ▼
┌──────────────────┐  ┌──────────────────────────────────┐
│   PostgreSQL DB  │  │   Blockchain Client (RPC)        │
│                  │  │  ┌──────────────────────────┐    │
│  ┌────────────┐  │  │  │  Event Listener Service  │    │
│  │ Schedules  │◄─┼──┼──┤  - Historical Sync       │    │
│  │  Events    │  │  │  │  - Real-time Watching    │    │
│  └────────────┘  │  │  └──────────────────────────┘    │
│                  │  │                                  │
└──────────────────┘  └───────────┬──────────────────────┘
                                  │ JSON-RPC
                                  ▼
                      ┌───────────────────────┐
                      │  Base Sepolia Network │
                      │  Smart Contracts      │
                      └───────────────────────┘
```

## Component Breakdown

### 1. HTTP Layer (`internal/api/`)

**Purpose**: Handle HTTP requests and responses

**Files**:
- `handlers.go` - Request handlers for each endpoint
- `router.go` - Route definitions and middleware

**Responsibilities**:
- Parse request parameters
- Validate input (address format, limits)
- Call appropriate service layer methods
- Format and return JSON responses
- Handle errors gracefully

**Example Flow**:
```
GET /api/v1/schedules/0x123...
  → Router maps to handler.GetSchedule()
  → Handler validates address
  → Handler calls database.GetScheduleByBeneficiary()
  → Handler formats and returns JSON
```

### 2. Database Layer (`internal/database/`)

**Purpose**: Abstract database operations

**File**: `database.go`

**Key Methods**:
- `GetScheduleByBeneficiary()` - Query schedule by address
- `GetAllSchedules()` - List schedules with pagination
- `CreateOrUpdateSchedule()` - Upsert schedule data
- `CreateEvent()` - Record blockchain event
- `GetEventsByBeneficiary()` - Query events for address
- `GetLastProcessedBlock()` - Track sync progress

**Design Patterns**:
- Repository pattern
- GORM for SQL abstraction
- Soft deletes for data safety
- Automatic timestamps

### 3. Blockchain Layer (`internal/blockchain/`)

**Purpose**: Interact with Ethereum blockchain

**Files**:
- `client.go` - Ethereum RPC client wrapper
- `listener.go` - Event synchronization service

#### `client.go` - Blockchain Client

**Responsibilities**:
- Connect to Ethereum RPC
- Read contract state (`vestingSchedules`, `vestedAmount`)
- Subscribe to contract events
- Fetch historical events in batches

**Key Methods**:
```go
NewClient()                  // Connect to RPC
GetVestingSchedule()         // Read contract state
GetVestedAmount()            // Calculate vested amount
WatchEvents()                // Subscribe to new events
FetchHistoricalEvents()      // Batch fetch past events
```

#### `listener.go` - Event Listener

**Responsibilities**:
- Sync historical events on startup
- Watch for new events in real-time
- Parse and store events to database
- Update vesting schedules based on events

**Event Processing Flow**:
```
1. On Startup:
   - Get last processed block from DB
   - Fetch all events since then in batches
   - Parse and store to database

2. Real-time:
   - Subscribe to contract events
   - Receive new events as they happen
   - Parse and store immediately
   - Update related schedule data
```

**Event Types Handled**:
- `VestingScheduleCreated` → Create new schedule
- `TokensReleased` → Update released amount
- `VestingRevoked` → Mark schedule as revoked

### 4. Data Models (`internal/models/`)

**Purpose**: Define data structures

**File**: `vesting.go`

**Models**:

#### VestingSchedule
```go
type VestingSchedule struct {
    ID          uint
    Beneficiary string     // Ethereum address
    Start       time.Time
    Cliff       time.Time
    Duration    int64      // Seconds
    Amount      string     // Wei (as string for big numbers)
    Released    string     // Wei released
    Revocable   bool
    Revoked     bool
    Timestamps             // CreatedAt, UpdatedAt, DeletedAt
}
```

#### VestingEvent
```go
type VestingEvent struct {
    ID              uint
    EventType       string  // VestingScheduleCreated, etc.
    Beneficiary     string
    Amount          string
    BlockNumber     uint64
    TransactionHash string  // Unique identifier
    Timestamp       time.Time
}
```

### 5. Configuration (`internal/config/`)

**Purpose**: Load and manage configuration

**File**: `config.go`

**Configuration Sources** (in order of precedence):
1. Environment variables
2. `.env` file
3. Default values

**Key Settings**:
- `SERVER_PORT` - HTTP server port
- `DATABASE_URL` - PostgreSQL connection string
- `ETHEREUM_RPC` - RPC endpoint
- `VESTING_CONTRACT_ADDRESS` - Contract address
- `START_BLOCK` - Block to start syncing from

### 6. Contract Bindings (`pkg/contracts/`)

**Purpose**: Define contract ABI and types

**File**: `vesting.go`

**Contains**:
- Contract ABI JSON
- Go struct representations
- Type definitions for events
- Interface methods

**Note**: In production, use `abigen` to generate bindings from compiled contract artifacts.

## Data Flow

### Read Vesting Schedule

```
1. Client → GET /api/v1/schedules/0x123...
2. Router → Handler.GetSchedule()
3. Handler validates address format
4. Handler → Database.GetScheduleByBeneficiary(address)
5. Database executes SQL query
6. Database ← Schedule row
7. Handler formats to JSON
8. Client ← JSON response
```

### Sync Blockchain Events

```
1. On Startup:
   Listener.Start(startBlock)
   ↓
2. Fetch last processed block from DB
   ↓
3. FOR each batch (10,000 blocks):
   ├─ Client.FetchHistoricalEvents(from, to)
   ├─ Parse event logs
   ├─ FOR each event:
   │  ├─ Save to vesting_events table
   │  └─ Update vesting_schedules table
   └─ Continue to next batch
   ↓
4. Subscribe to new events:
   Client.WatchEvents()
   ↓
5. FOR each new event:
   ├─ Parse event
   ├─ Save to database
   └─ Log success
```

### Get Real-time Vested Amount

```
1. Client → GET /api/v1/vested/0x123...
2. Handler → Blockchain.GetVestedAmount(address)
3. Blockchain → RPC call to contract.vestedAmount(address)
4. Contract executes view function
5. Contract → Returns uint256 vested amount
6. Handler → Database.GetScheduleByBeneficiary()
7. Handler calculates unreleased = vested - released
8. Client ← JSON with vested, total, released, unreleased
```

## Database Schema

### Tables

#### `vesting_schedules`
```sql
CREATE TABLE vesting_schedules (
    id SERIAL PRIMARY KEY,
    beneficiary VARCHAR(42) NOT NULL,
    start TIMESTAMP NOT NULL,
    cliff TIMESTAMP NOT NULL,
    duration BIGINT NOT NULL,
    amount VARCHAR NOT NULL,      -- Store as string for big numbers
    released VARCHAR NOT NULL,
    revocable BOOLEAN DEFAULT TRUE,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_beneficiary ON vesting_schedules(beneficiary);
CREATE INDEX idx_deleted_at ON vesting_schedules(deleted_at);
```

#### `vesting_events`
```sql
CREATE TABLE vesting_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    beneficiary VARCHAR(42) NOT NULL,
    amount VARCHAR NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_type ON vesting_events(event_type);
CREATE INDEX idx_event_beneficiary ON vesting_events(beneficiary);
CREATE INDEX idx_block_number ON vesting_events(block_number);
```

## API Endpoints

### Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/api/v1/schedules` | List all schedules |
| GET | `/api/v1/schedules/:address` | Get schedule by address |
| GET | `/api/v1/vested/:address` | Get vested amount (blockchain) |
| GET | `/api/v1/events/:address` | Get events for address |
| GET | `/api/v1/stats` | Get statistics |

## Performance Considerations

### Database Optimization

1. **Indexes**:
   - `beneficiary` on schedules (frequent lookups)
   - `event_type`, `beneficiary`, `block_number` on events
   - `transaction_hash` unique (prevent duplicates)

2. **Query Optimization**:
   - Limit/offset pagination (max 1000 results)
   - Use `WHERE revoked = false` to filter active schedules
   - Indexes on foreign key relationships

### RPC Rate Limiting

1. **Historical Sync**:
   - Batch requests (10,000 blocks per request)
   - Avoid hitting RPC rate limits
   - Use Alchemy/Infura for production

2. **Real-time Events**:
   - Single subscription for all events
   - Filter by contract address
   - Automatic reconnection on disconnect

### Caching Strategy

**Current**: Database acts as cache for blockchain data

**Future Enhancements**:
- Redis for frequently accessed schedules
- Cache `vestedAmount()` calculations (TTL 1 minute)
- Cache statistics (TTL 5 minutes)

## Error Handling

### Levels

1. **HTTP Layer**:
   - 400 Bad Request - Invalid input
   - 404 Not Found - Schedule doesn't exist
   - 500 Internal Server Error - Database/RPC errors

2. **Database Layer**:
   - Log errors
   - Return Go errors to handler
   - Use GORM error types

3. **Blockchain Layer**:
   - Retry on transient RPC errors
   - Log and continue on parse errors
   - Graceful degradation if RPC is down

## Security Considerations

### Current Implementation

1. **Read-Only**: No write operations to blockchain
2. **Input Validation**: Address format validation
3. **CORS**: Configured for specific origins
4. **SQL Injection**: Protected by GORM parameterization
5. **Rate Limiting**: None (add in production)

### Production Additions Needed

1. **Authentication**: API keys or JWT
2. **Rate Limiting**: Per-IP or per-API-key
3. **HTTPS**: TLS encryption
4. **Monitoring**: Request logging, anomaly detection
5. **Secrets**: Use environment variables, never commit

## Deployment Architecture

### Development

```
localhost:8080 → API Server
localhost:5432 → PostgreSQL
https://sepolia.base.org → Base Sepolia RPC
```

### Production

```
Load Balancer (HTTPS)
    ↓
API Servers (multiple instances)
    ↓
Managed PostgreSQL (RDS, Cloud SQL)
    ↓
Alchemy/Infura RPC (high availability)
```

## Future Enhancements

1. **Write Operations**:
   - Create vesting schedules via API
   - Release tokens on behalf of beneficiary
   - Revoke schedules

2. **Advanced Queries**:
   - Filter by date ranges
   - Sort by amount, start date
   - Full-text search

3. **WebSocket Support**:
   - Real-time event notifications
   - Live vested amount updates

4. **Analytics**:
   - Total value locked
   - Vesting timeline charts
   - Beneficiary statistics

5. **Multi-Contract Support**:
   - Support multiple vesting contracts
   - Contract registry/discovery

## Testing Strategy

### Unit Tests

- Database methods
- Event parsing logic
- Configuration loading

### Integration Tests

- API endpoints with test database
- Mock blockchain client
- End-to-end flows

### Load Tests

- Concurrent API requests
- Database connection pooling
- RPC rate limit handling

---

**Last Updated**: October 16, 2025
**Version**: 1.0
