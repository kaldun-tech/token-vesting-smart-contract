#!/bin/bash

echo "🔧 Fixing Go Environment Variables"
echo "==================================="
echo ""

# Check current settings
echo "Current Go environment:"
echo "  GOPATH: $(go env GOPATH)"
echo "  GOMODCACHE: $(go env GOMODCACHE)"
echo ""

# Fix GOPATH to user's home directory
export GOPATH="$HOME/go"
export GOMODCACHE="$GOPATH/pkg/mod"

echo "Setting correct Go environment:"
echo "  GOPATH: $GOPATH"
echo "  GOMODCACHE: $GOMODCACHE"
echo ""

# Create directories
mkdir -p "$GOPATH/pkg/mod"
mkdir -p "$GOPATH/bin"

# Add to shell profile if not already there
SHELL_PROFILE="$HOME/.bashrc"

if ! grep -q "export GOPATH=" "$SHELL_PROFILE"; then
    echo "" >> "$SHELL_PROFILE"
    echo "# Go environment variables" >> "$SHELL_PROFILE"
    echo "export GOPATH=\"\$HOME/go\"" >> "$SHELL_PROFILE"
    echo "export PATH=\"\$PATH:\$GOPATH/bin\"" >> "$SHELL_PROFILE"
    echo "✅ Added Go environment variables to $SHELL_PROFILE"
else
    echo "ℹ️  Go environment variables already in $SHELL_PROFILE"
fi

echo ""
echo "📦 Installing dependencies with correct settings..."
GOPATH="$HOME/go" go mod tidy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Dependencies installed."
    echo ""
    echo "⚠️  IMPORTANT: Run this command to apply the changes:"
    echo "   source ~/.bashrc"
    echo ""
    echo "Or close and reopen your terminal."
    echo ""
else
    echo ""
    echo "❌ Failed to install dependencies."
    echo "Please run: source ~/.bashrc"
    echo "Then try again: go mod tidy"
    echo ""
fi
