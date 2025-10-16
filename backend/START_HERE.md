# 🚀 START HERE - Quick Setup Guide

**Having issues?** This guide will get you running in 5 minutes.

## The Problem You're Seeing

```bash
go: could not create module cache: stat /usr/bin/go/pkg/mod: not a directory
```

This happens because your Go environment is misconfigured in WSL.

## Quick Fix (3 Steps)

### Step 1: Fix Go Environment

```bash
cd backend
./fix-go-env.sh
source ~/.bashrc
```

**What this does**: Sets `GOPATH` to the correct location (`$HOME/go` instead of `/usr/bin/go`)

### Step 2: Install Dependencies

```bash
make setup
```

Or manually:
```bash
go mod tidy
```

### Step 3: Start PostgreSQL

**Using Docker (Recommended)**:
```bash
make db-start
```

**Or manually with Docker Compose**:
```bash
docker-compose up -d postgres
```

**Or install PostgreSQL locally** (see SETUP_FIXES.md)

---

## Full Setup Command Sequence

Copy-paste this entire block:

```bash
# Navigate to backend
cd /mnt/c/git/token-vesting-smart-contract/backend

# Fix Go environment
./fix-go-env.sh
source ~/.bashrc

# Install dependencies
go mod tidy

# Start PostgreSQL
docker-compose up -d postgres

# Wait for it to start
sleep 5

# Configure environment
cp .env.docker .env

# Edit .env with your contract addresses (important!)
nano .env  # or code .env, or vi .env

# Run the API
go run cmd/api/main.go
```

---

## What You Need to Configure in .env

Open `.env` and update these values:

```bash
# Required: Your deployed contract address
VESTING_CONTRACT_ADDRESS=0xYourContractAddressHere

# Required: Your token address
TOKEN_ADDRESS=0xYourTokenAddressHere

# Required: Block number when contract was deployed
START_BLOCK=15000000  # Find this on Basescan
```

**How to find START_BLOCK**:
1. Go to https://sepolia.basescan.org/
2. Search for your contract address
3. Look at the "Contract Creation" transaction
4. Use that block number

---

## Verify Everything Works

### Terminal 1: Start the API

```bash
cd backend
go run cmd/api/main.go
```

You should see:
```
🚀 Starting Token Vesting API Server...
✅ Database connected
✅ Blockchain client connected
🌐 Server starting on :8080
```

### Terminal 2: Test the API

```bash
# Health check
curl http://localhost:8080/health

# Should return:
# {"status":"ok","service":"token-vesting-api"}
```

---

## Using Make Commands

After fixing Go environment, you can use these shortcuts:

```bash
# Show all commands
make help

# Start PostgreSQL
make db-start

# Install dependencies
make setup

# Run API server
make run

# Stop database
make db-stop
```

---

## Still Having Issues?

### Issue: "docker-compose: command not found"

**Fix**:
```bash
# Install Docker Compose
sudo apt update
sudo apt install docker-compose

# Or use docker compose (newer syntax)
docker compose up -d postgres
```

### Issue: "Permission denied" when running Docker

**Fix**:
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

### Issue: "Port 5432 already in use"

**Fix**:
```bash
# Stop any running PostgreSQL
sudo service postgresql stop

# Or change the port in docker-compose.yml
```

### Issue: Still getting Go module errors

**Manual fix**:
```bash
# Remove incorrect GOPATH from .bashrc
nano ~/.bashrc
# Delete any line that says: export GOPATH=/usr/bin/go

# Add correct GOPATH
echo 'export GOPATH="$HOME/go"' >> ~/.bashrc
echo 'export PATH="$PATH:$GOPATH/bin"' >> ~/.bashrc
source ~/.bashrc

# Verify
go env GOPATH
# Should show: /home/yourusername/go

# Create directories
mkdir -p $HOME/go/pkg/mod

# Try again
cd backend
go mod tidy
```

---

## PostgreSQL Options

### Option 1: Docker (Recommended)

**Pros**: Easy, isolated, no installation needed

```bash
make db-start    # Start
make db-stop     # Stop
make db-shell    # Open SQL shell
make db-logs     # View logs
```

### Option 2: Local Installation

**Pros**: Always running, native performance

```bash
# Install
sudo apt install postgresql

# Create user and database
sudo -u postgres psql
CREATE USER vesting WITH PASSWORD 'vesting123';
CREATE DATABASE vesting OWNER vesting;
\q

# Update .env
DATABASE_URL=postgres://vesting:vesting123@localhost:5432/vesting?sslmode=disable
```

---

## Next Steps

Once the API is running:

1. **Test endpoints**:
   ```bash
   curl http://localhost:8080/api/v1/schedules
   curl http://localhost:8080/api/v1/stats
   ```

2. **Check database**:
   ```bash
   make db-shell
   # In psql:
   \dt  # List tables
   SELECT * FROM vesting_schedules;
   ```

3. **View logs**:
   - API logs appear in the terminal where you ran `go run cmd/api/main.go`
   - Database logs: `make db-logs`

4. **Stop everything**:
   ```bash
   # Stop API: Ctrl+C in the terminal
   # Stop database: make db-stop
   ```

---

## Documentation

- **SETUP_FIXES.md** - Detailed troubleshooting
- **README.md** - Full API documentation
- **QUICKSTART.md** - Alternative setup guide
- **ARCHITECTURE.md** - System design
- **Makefile** - All available commands

---

## Quick Reference Card

```bash
# Setup (one-time)
./fix-go-env.sh && source ~/.bashrc
go mod tidy
cp .env.docker .env

# Daily workflow
make db-start              # Start database
go run cmd/api/main.go     # Start API
# Ctrl+C to stop API
make db-stop               # Stop database

# Useful commands
make help                  # Show all commands
make db-shell              # Database console
curl http://localhost:8080/health  # Test API
```

---

**Need more help?** Check SETUP_FIXES.md for detailed troubleshooting.

**Last Updated**: October 16, 2025
