# Setup Fixes and Troubleshooting

## Issue 1: Go Module Cache Error

### Problem
```
go: could not create module cache: stat /usr/bin/go/pkg/mod: not a directory
```

### Root Cause
Your `GOPATH` is incorrectly set to `/usr/bin/go` (where the Go binary is located) instead of your user workspace.

### Solution

**Option 1: Run the fix script (Recommended)**

```bash
cd backend
./fix-go-env.sh
source ~/.bashrc
```

**Option 2: Manual fix**

1. **Check current GOPATH**:
   ```bash
   go env GOPATH
   # If it shows /usr/bin/go, it's wrong
   ```

2. **Fix it permanently**:
   ```bash
   # Add to ~/.bashrc
   echo 'export GOPATH="$HOME/go"' >> ~/.bashrc
   echo 'export PATH="$PATH:$GOPATH/bin"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Create directories**:
   ```bash
   mkdir -p $HOME/go/pkg/mod
   mkdir -p $HOME/go/bin
   ```

4. **Install dependencies**:
   ```bash
   cd backend
   go mod tidy
   ```

### Verification

```bash
# Should show /home/yourusername/go
go env GOPATH

# Should show /home/yourusername/go/pkg/mod
go env GOMODCACHE

# Test it works
cd backend
go mod tidy
# Should complete without errors
```

---

## Issue 2: PostgreSQL Database Setup

### Question: Docker vs Local Installation?

You have **two options** for running PostgreSQL:

### Option A: Docker Compose (Recommended for Development)

**Advantages**:
- ✅ No PostgreSQL installation needed
- ✅ Isolated, easy to start/stop/reset
- ✅ Same environment as production
- ✅ Can easily run multiple databases

**Steps**:

1. **Start PostgreSQL**:
   ```bash
   cd backend
   docker-compose up -d postgres
   ```

2. **Verify it's running**:
   ```bash
   docker-compose ps
   # Should show vesting-postgres as "running"

   # Test connection
   docker-compose exec postgres psql -U vesting -c "SELECT 1"
   ```

3. **Use this .env**:
   ```bash
   cp .env.docker .env
   ```
   The `DATABASE_URL` is already configured for Docker:
   ```
   DATABASE_URL=postgres://vesting:vesting123@localhost:5432/vesting?sslmode=disable
   ```

4. **Run the API**:
   ```bash
   go run cmd/api/main.go
   ```

5. **Stop when done**:
   ```bash
   docker-compose down
   # Or to also remove data:
   docker-compose down -v
   ```

**Optional: PgAdmin GUI**

```bash
# Start pgAdmin web interface
docker-compose --profile tools up -d pgadmin

# Access at http://localhost:5050
# Email: admin@vesting.local
# Password: admin123
```

### Option B: Local PostgreSQL Installation

**Advantages**:
- ✅ Native performance
- ✅ Always running (system service)

**Installation**:

```bash
# Ubuntu/Debian/WSL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo service postgresql start

# Create user and database
sudo -u postgres psql

# In psql:
CREATE USER vesting WITH PASSWORD 'vesting123';
CREATE DATABASE vesting OWNER vesting;
\q
```

**Configure .env**:
```bash
cp .env.example .env
# Edit DATABASE_URL:
DATABASE_URL=postgres://vesting:vesting123@localhost:5432/vesting?sslmode=disable
```

**Verify**:
```bash
psql -U vesting -d vesting -c "SELECT 1"
```

---

## Recommended Setup Workflow

### For Development (Using Docker)

```bash
# 1. Fix Go environment
cd backend
./fix-go-env.sh
source ~/.bashrc

# 2. Install Go dependencies
go mod tidy

# 3. Start PostgreSQL with Docker
docker-compose up -d postgres

# Wait a few seconds for it to start
sleep 5

# 4. Configure environment
cp .env.docker .env
# Edit .env with your contract addresses

# 5. Run the API
go run cmd/api/main.go
```

### Verify Everything Works

```bash
# Terminal 1: API server should be running
go run cmd/api/main.go

# Terminal 2: Test endpoints
curl http://localhost:8080/health
# Should return: {"status":"ok","service":"token-vesting-api"}

# Check database connection
docker-compose exec postgres psql -U vesting -d vesting -c "\dt"
# Should show vesting_schedules and vesting_events tables
```

---

## Quick Reference Commands

### Docker Compose

```bash
# Start PostgreSQL
docker-compose up -d postgres

# View logs
docker-compose logs -f postgres

# Stop
docker-compose down

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d postgres

# Access PostgreSQL CLI
docker-compose exec postgres psql -U vesting

# Backup database
docker-compose exec postgres pg_dump -U vesting vesting > backup.sql

# Restore database
docker-compose exec -T postgres psql -U vesting < backup.sql
```

### Go Commands

```bash
# Install dependencies
go mod tidy

# Run server
go run cmd/api/main.go

# Build binary
go build -o bin/api cmd/api/main.go

# Run tests
go test ./...

# Format code
go fmt ./...
```

---

## Common Issues

### Issue: "Connection refused" when starting API

**Cause**: PostgreSQL not running

**Fix**:
```bash
# If using Docker:
docker-compose up -d postgres
docker-compose ps  # Check it's running

# If using local PostgreSQL:
sudo service postgresql start
sudo service postgresql status
```

### Issue: "Database does not exist"

**Fix**:
```bash
# Docker:
docker-compose down -v
docker-compose up -d postgres

# Local:
sudo -u postgres createdb vesting
```

### Issue: "Authentication failed"

**Cause**: Wrong credentials in DATABASE_URL

**Fix**: Check `.env` file matches your setup:
- Docker: `vesting:vesting123`
- Local: Whatever you set during installation

### Issue: Port 5432 already in use

**Cause**: Another PostgreSQL instance running

**Fix**:
```bash
# Find what's using the port
sudo lsof -i :5432

# Stop local PostgreSQL if you want to use Docker
sudo service postgresql stop

# Or change Docker port in docker-compose.yml:
ports:
  - "5433:5432"  # Use 5433 on host
```

---

## Environment Variables Reference

| Variable | Docker Value | Local Value | Required |
|----------|--------------|-------------|----------|
| `DATABASE_URL` | `postgres://vesting:vesting123@localhost:5432/vesting?sslmode=disable` | Same or custom | ✅ Yes |
| `VESTING_CONTRACT_ADDRESS` | Your contract | Your contract | ✅ Yes |
| `TOKEN_ADDRESS` | Your token | Your token | ✅ Yes |
| `START_BLOCK` | Deployment block | Deployment block | ✅ Yes |
| `ETHEREUM_RPC` | `https://sepolia.base.org` | Same | ✅ Yes |
| `SERVER_PORT` | `8080` | `8080` | No (default) |

---

## Next Steps After Setup

1. ✅ Fix Go environment
2. ✅ Choose database option (Docker or Local)
3. ✅ Install dependencies (`go mod tidy`)
4. ✅ Configure `.env` file
5. ✅ Start database
6. ✅ Run API server
7. ✅ Test with `curl http://localhost:8080/health`

---

**Last Updated**: October 16, 2025
