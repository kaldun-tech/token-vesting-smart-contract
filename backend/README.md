# Token Vesting Backend API

A Go REST API service for the Token Vesting smart contract. This backend provides read-only access to vesting schedules, events, and statistics, with automatic blockchain event syncing to a PostgreSQL database.

## Features

- 📊 **REST API** - Query vesting schedules, vested amounts, and events
- 🔄 **Real-time Event Sync** - Automatically syncs blockchain events to database
- 🗄️ **PostgreSQL Database** - Caches blockchain data for fast queries
- 🔍 **Historical Data** - Syncs past events from a specified start block
- 📈 **Statistics** - Aggregated data about vesting schedules
- 🚀 **High Performance** - Built with Gin framework and go-ethereum

## Architecture

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐     ┌──────────────┐
│  REST API   │────▶│  PostgreSQL  │
│  (Gin)      │     │   Database   │
└──────┬──────┘     └──────────────┘
       │
       │ RPC
       ▼
┌─────────────┐
│  Ethereum   │
│  Blockchain │
│ (Base L2)   │
└─────────────┘
```

## Project Structure

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers.go          # HTTP request handlers
│   │   └── router.go            # Route definitions
│   ├── blockchain/
│   │   ├── client.go            # Ethereum client wrapper
│   │   └── listener.go          # Event listener service
│   ├── config/
│   │   └── config.go            # Configuration loader
│   ├── database/
│   │   └── database.go          # Database operations
│   └── models/
│       └── vesting.go           # Data models
├── pkg/
│   └── contracts/
│       └── vesting.go           # Smart contract ABI
├── .env.example                 # Example environment variables
├── .gitignore
├── go.mod                       # Go module definition
├── go.sum                       # Dependency checksums
└── README.md                    # This file
```

## Getting Started

### Prerequisites

- **Go 1.21+** - [Download](https://go.dev/dl/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **Base Sepolia RPC** - Use public RPC or Alchemy/Infura

### Installation

1. **Clone the repository**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   go mod download
   ```

3. **Set up PostgreSQL**:
   ```bash
   # Create database
   createdb vesting

   # Or using psql
   psql -U postgres
   CREATE DATABASE vesting;
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Update .env file**:
   ```bash
   # Required values
   DATABASE_URL=postgres://user:password@localhost:5432/vesting?sslmode=disable
   VESTING_CONTRACT_ADDRESS=0x5D6709Ce17C956833b66Ade058832C1890af19b7
   TOKEN_ADDRESS=0x...  # Your token address
   START_BLOCK=15000000  # Block when contract was deployed
   ```

### Running the API

```bash
# Run directly
go run cmd/api/main.go

# Or build and run
go build -o bin/api cmd/api/main.go
./bin/api
```

Server will start on `http://localhost:8080`

## API Endpoints

### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "service": "token-vesting-api"
}
```

### Get All Vesting Schedules

```http
GET /api/v1/schedules?limit=100&offset=0
```

**Query Parameters**:
- `limit` (optional) - Number of results (default: 100, max: 1000)
- `offset` (optional) - Pagination offset (default: 0)

**Response**:
```json
{
  "schedules": [
    {
      "id": 1,
      "beneficiary": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "start": "2024-01-01T00:00:00Z",
      "cliff": "2025-01-01T00:00:00Z",
      "duration": 126144000,
      "amount": "1000000000000000000000",
      "released": "250000000000000000000",
      "revocable": true,
      "revoked": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-06-01T00:00:00Z"
    }
  ],
  "limit": 100,
  "offset": 0,
  "count": 1
}
```

### Get Vesting Schedule by Address

```http
GET /api/v1/schedules/:address
```

**Example**:
```bash
curl http://localhost:8080/api/v1/schedules/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Response**:
```json
{
  "id": 1,
  "beneficiary": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "start": "2024-01-01T00:00:00Z",
  "cliff": "2025-01-01T00:00:00Z",
  "duration": 126144000,
  "amount": "1000000000000000000000",
  "released": "250000000000000000000",
  "revocable": true,
  "revoked": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-06-01T00:00:00Z"
}
```

### Get Vested Amount (Real-time)

```http
GET /api/v1/vested/:address
```

Queries the blockchain directly for current vested amount.

**Response**:
```json
{
  "beneficiary": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "vested_amount": "500000000000000000000",
  "total_amount": "1000000000000000000000",
  "released": "250000000000000000000",
  "unreleased": "250000000000000000000"
}
```

### Get Events for Address

```http
GET /api/v1/events/:address?limit=50&offset=0
```

**Response**:
```json
{
  "events": [
    {
      "id": 1,
      "event_type": "VestingScheduleCreated",
      "beneficiary": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "amount": "1000000000000000000000",
      "block_number": 15123456,
      "transaction_hash": "0xabc...",
      "timestamp": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:05Z"
    },
    {
      "id": 2,
      "event_type": "TokensReleased",
      "beneficiary": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "amount": "250000000000000000000",
      "block_number": 15234567,
      "transaction_hash": "0xdef...",
      "timestamp": "2024-06-01T00:00:00Z",
      "created_at": "2024-06-01T00:00:05Z"
    }
  ],
  "limit": 50,
  "offset": 0,
  "count": 2
}
```

### Get Statistics

```http
GET /api/v1/stats
```

**Response**:
```json
{
  "total_schedules": 42,
  "active_schedules": 38
}
```

## Event Types

The API tracks three types of blockchain events:

1. **VestingScheduleCreated** - New vesting schedule created
2. **TokensReleased** - Tokens released to beneficiary
3. **VestingRevoked** - Vesting schedule revoked by owner

## Database Schema

### vesting_schedules

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-increment ID |
| beneficiary | VARCHAR(42) | Ethereum address (indexed) |
| start | TIMESTAMP | Start time |
| cliff | TIMESTAMP | Cliff time |
| duration | BIGINT | Duration in seconds |
| amount | VARCHAR | Total vesting amount |
| released | VARCHAR | Amount released |
| revocable | BOOLEAN | Can be revoked |
| revoked | BOOLEAN | Has been revoked |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |
| deleted_at | TIMESTAMP | Soft delete |

### vesting_events

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-increment ID |
| event_type | VARCHAR | Event name (indexed) |
| beneficiary | VARCHAR(42) | Ethereum address (indexed) |
| amount | VARCHAR | Token amount |
| block_number | BIGINT | Block number (indexed) |
| transaction_hash | VARCHAR(66) | TX hash (unique) |
| timestamp | TIMESTAMP | Event time |
| created_at | TIMESTAMP | Record creation |

## Development

### Running Tests

```bash
go test ./...
```

### Code Formatting

```bash
go fmt ./...
```

### Linting

```bash
# Install golangci-lint
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Run linter
golangci-lint run
```

### Generating Contract Bindings

If you need to regenerate contract bindings from ABI:

```bash
# Install abigen
go install github.com/ethereum/go-ethereum/cmd/abigen@latest

# Generate bindings
abigen --abi ../artifacts/contracts/TokenVesting.sol/TokenVesting.json \
       --pkg contracts \
       --type TokenVesting \
       --out pkg/contracts/vesting_generated.go
```

## Deployment

### Using Docker

```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o api cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/api .
EXPOSE 8080
CMD ["./api"]
```

Build and run:
```bash
docker build -t vesting-api .
docker run -p 8080:8080 --env-file .env vesting-api
```

### Using Docker Compose

See `../docker-compose.yml` in project root for full stack deployment.

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql -U postgres -d vesting -c "SELECT 1;"

# Check environment variable
echo $DATABASE_URL
```

### RPC Connection Issues

```bash
# Test RPC endpoint
curl -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Event Sync Not Working

- Check `START_BLOCK` is set to contract deployment block
- Verify contract address is correct
- Check RPC rate limits (use Alchemy/Infura for production)

## Performance Tuning

### Database Indexes

Already created by GORM migrations:
- `beneficiary` on vesting_schedules
- `event_type`, `beneficiary`, `block_number` on vesting_events
- `transaction_hash` unique index

### Caching

For production, consider adding Redis caching for:
- Frequently accessed schedules
- Vested amount calculations
- Statistics

### Rate Limiting

Add rate limiting middleware:
```bash
go get github.com/ulule/limiter/v3
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file

## Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/token-vesting/issues)
- Documentation: See `/docs` directory
- Discord: [Join our community](#)

---

**Built with ❤️ using Go and Ethereum**
