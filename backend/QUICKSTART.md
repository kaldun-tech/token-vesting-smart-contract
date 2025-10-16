# Quick Start Guide

Get the Token Vesting API running in 5 minutes.

## Prerequisites

- ✅ Go 1.21+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ Contract deployed to Base Sepolia

## Step 1: Install Dependencies

```bash
cd backend
make setup
```

Or manually:
```bash
go mod download
go mod tidy
```

## Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env  # or vi, code, etc.
```

**Required values**:
```bash
DATABASE_URL=postgres://user:password@localhost:5432/vesting?sslmode=disable
VESTING_CONTRACT_ADDRESS=0x5D6709Ce17C956833b66Ade058832C1890af19b7
TOKEN_ADDRESS=0x...
START_BLOCK=15000000
```

## Step 3: Create Database

```bash
# Option 1: Using make
make db-create

# Option 2: Using createdb
createdb vesting

# Option 3: Using psql
psql -U postgres -c "CREATE DATABASE vesting;"
```

## Step 4: Run the Server

```bash
# Option 1: Using make
make run

# Option 2: Direct go run
go run cmd/api/main.go

# Option 3: Build and run binary
make build
./bin/api
```

## Step 5: Test the API

```bash
# Health check
curl http://localhost:8080/health

# Get all schedules
curl http://localhost:8080/api/v1/schedules

# Get specific schedule
curl http://localhost:8080/api/v1/schedules/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Get vested amount
curl http://localhost:8080/api/v1/vested/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## Expected Output

```
🚀 Starting Token Vesting API Server...
📝 Environment: development
✅ Database connected and migrated successfully
✅ Connected to Ethereum network (Chain ID: 84532)
✅ Vesting contract loaded at 0x5D6709Ce17C956833b66Ade058832C1890af19b7
📜 Syncing historical events...
📊 Fetching events from block 15000000 to 15234567
✅ Processed blocks 15000000 to 15010000 (3 events)
✅ Historical sync complete
👂 Listening for new events...
🌐 Server starting on :8080
📖 API Documentation available at http://localhost:8080/health
```

## Troubleshooting

### "Database connection failed"

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d vesting -c "SELECT 1;"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### "Failed to connect to Ethereum node"

```bash
# Test RPC endpoint
curl -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check ETHEREUM_RPC in .env
cat .env | grep ETHEREUM_RPC
```

### "No events synced"

- Verify `START_BLOCK` is set to the block where contract was deployed
- Check `VESTING_CONTRACT_ADDRESS` is correct
- Ensure contract has some activity (schedules created)

### Go Module Issues

```bash
# Clear module cache
go clean -modcache

# Re-download modules
go mod download
go mod tidy
```

## Next Steps

- 📖 Read full [README.md](README.md) for detailed documentation
- 🔧 Configure CORS for your frontend domain
- 🚀 Deploy to production (see Deployment section)
- 📊 Add monitoring and logging
- 🔒 Add authentication (if needed)

## Development Workflow

```bash
# 1. Make code changes

# 2. Format code
make fmt

# 3. Run tests
make test

# 4. Rebuild and run
make build
./bin/api
```

## Using Docker

```bash
# Build image
make docker

# Run with environment file
docker run -p 8080:8080 --env-file .env vesting-api:latest
```

## Production Checklist

- [ ] Set `ENVIRONMENT=production` in .env
- [ ] Use managed PostgreSQL (RDS, Cloud SQL, etc.)
- [ ] Use Alchemy/Infura RPC (not public RPC)
- [ ] Set up proper logging
- [ ] Add rate limiting
- [ ] Enable HTTPS
- [ ] Set up monitoring (Prometheus, Datadog, etc.)
- [ ] Configure backups for database
- [ ] Set up CI/CD pipeline

---

**Need Help?** Check the [README.md](README.md) or open an issue on GitHub.
