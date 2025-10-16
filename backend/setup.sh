#!/bin/bash

echo "🚀 Setting up Token Vesting Backend API"
echo "========================================"
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21+ from https://go.dev/dl/"
    exit 1
fi

echo "✅ Go version: $(go version)"
echo ""

# Install dependencies
echo "📦 Installing Go dependencies..."
go get github.com/gin-gonic/gin
go get github.com/gin-contrib/cors
go get github.com/ethereum/go-ethereum
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/joho/godotenv

# Tidy up
go mod tidy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Copy .env.example to .env"
    echo "     cp .env.example .env"
    echo ""
    echo "  2. Edit .env with your configuration"
    echo "     - Set DATABASE_URL"
    echo "     - Set VESTING_CONTRACT_ADDRESS"
    echo "     - Set TOKEN_ADDRESS"
    echo "     - Set START_BLOCK"
    echo ""
    echo "  3. Set up PostgreSQL database"
    echo "     createdb vesting"
    echo ""
    echo "  4. Run the API server"
    echo "     go run cmd/api/main.go"
    echo ""
else
    echo ""
    echo "❌ Failed to install dependencies"
    echo ""
    echo "Try running manually:"
    echo "  cd backend"
    echo "  go mod download"
    echo "  go mod tidy"
    echo ""
fi
