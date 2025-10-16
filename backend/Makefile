.PHONY: help setup build run test clean docker fix-go

# Default target
help:
	@echo "Token Vesting Backend API - Make Commands"
	@echo "=========================================="
	@echo ""
	@echo "Setup:"
	@echo "  make fix-go      - Fix Go environment variables"
	@echo "  make setup       - Install dependencies"
	@echo "  make db-start    - Start PostgreSQL (Docker)"
	@echo "  make db-stop     - Stop PostgreSQL"
	@echo ""
	@echo "Development:"
	@echo "  make run         - Run the API server"
	@echo "  make dev         - Run with auto-reload"
	@echo "  make build       - Build the API binary"
	@echo "  make test        - Run tests"
	@echo "  make fmt         - Format code"
	@echo "  make lint        - Run linter"
	@echo ""
	@echo "Database:"
	@echo "  make db-start    - Start PostgreSQL with Docker"
	@echo "  make db-stop     - Stop PostgreSQL"
	@echo "  make db-reset    - Reset database (WARNING: deletes data)"
	@echo "  make db-shell    - Open PostgreSQL shell"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Clean build artifacts"
	@echo ""

# Fix Go environment
fix-go:
	@echo "🔧 Fixing Go environment..."
	./fix-go-env.sh

# Setup project
setup:
	@echo "📦 Installing dependencies..."
	go mod download
	go mod tidy
	@echo "✅ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. make db-start        # Start PostgreSQL"
	@echo "  2. cp .env.docker .env  # Configure environment"
	@echo "  3. make run             # Start API server"

# Build binary
build:
	@echo "🔨 Building API server..."
	go build -o bin/api cmd/api/main.go
	@echo "✅ Binary built: bin/api"

# Run server
run:
	@echo "🚀 Starting API server..."
	go run cmd/api/main.go

# Run tests
test:
	@echo "🧪 Running tests..."
	go test -v ./...

# Format code
fmt:
	@echo "✨ Formatting code..."
	go fmt ./...

# Lint code
lint:
	@echo "🔍 Linting code..."
	golangci-lint run

# Clean build artifacts
clean:
	@echo "🧹 Cleaning..."
	rm -rf bin/
	rm -f *.log
	@echo "✅ Clean complete!"

# Build Docker image
docker:
	@echo "🐳 Building Docker image..."
	docker build -t vesting-api:latest .
	@echo "✅ Docker image built!"

# Start PostgreSQL with Docker
db-start:
	@echo "🐘 Starting PostgreSQL with Docker..."
	docker-compose up -d postgres
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 5
	@echo "✅ PostgreSQL is running!"
	@echo ""
	@echo "Connection details:"
	@echo "  Host: localhost"
	@echo "  Port: 5432"
	@echo "  User: vesting"
	@echo "  Password: vesting123"
	@echo "  Database: vesting"

# Stop PostgreSQL
db-stop:
	@echo "🛑 Stopping PostgreSQL..."
	docker-compose down
	@echo "✅ PostgreSQL stopped"

# Reset database (WARNING: deletes all data)
db-reset:
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker-compose up -d postgres; \
		sleep 5; \
		echo "✅ Database reset complete"; \
	fi

# Open PostgreSQL shell
db-shell:
	@echo "🐘 Opening PostgreSQL shell..."
	docker-compose exec postgres psql -U vesting

# View database logs
db-logs:
	@echo "📋 PostgreSQL logs:"
	docker-compose logs -f postgres

# Development mode with auto-reload (requires air)
dev:
	@echo "🔥 Starting development server with auto-reload..."
	@command -v air >/dev/null 2>&1 || { echo "Installing air..."; go install github.com/cosmtrek/air@latest; }
	air
