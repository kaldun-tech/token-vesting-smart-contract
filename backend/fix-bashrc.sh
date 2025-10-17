#!/bin/bash

echo "🔧 Fixing GOPATH in .bashrc"
echo "=============================="
echo ""

BASHRC="$HOME/.bashrc"
BACKUP="$HOME/.bashrc.backup.$(date +%Y%m%d_%H%M%S)"

# Create backup
echo "📋 Creating backup: $BACKUP"
cp "$BASHRC" "$BACKUP"

# Remove the incorrect GOPATH line
echo "🗑️  Removing incorrect GOPATH..."
sed -i "/export GOPATH='\/usr\/bin\/go'/d" "$BASHRC"
sed -i '/export GOPATH="\/usr\/bin\/go"/d' "$BASHRC"
sed -i '/export GOPATH=\/usr\/bin\/go/d' "$BASHRC"

# Add correct GOPATH if not present
if ! grep -q 'export GOPATH="$HOME/go"' "$BASHRC"; then
    echo ""  >> "$BASHRC"
    echo "# Go environment (fixed $(date +%Y-%m-%d))" >> "$BASHRC"
    echo 'export GOPATH="$HOME/go"' >> "$BASHRC"
    echo 'export PATH="$PATH:$GOPATH/bin"' >> "$BASHRC"
    echo "✅ Added correct GOPATH to .bashrc"
else
    echo "ℹ️  Correct GOPATH already exists"
fi

echo ""
echo "🎉 Fixed! Your .bashrc has been updated."
echo ""
echo "📝 Changes made:"
echo "   - Removed: export GOPATH='/usr/bin/go'"
echo "   - Added:   export GOPATH=\"\$HOME/go\""
echo ""
echo "🔄 To apply changes, run ONE of these:"
echo ""
echo "   Option 1 (apply in this terminal):"
echo "   source ~/.bashrc"
echo ""
echo "   Option 2 (open new terminal):"
echo "   Just close this terminal and open a new one"
echo ""
echo "✅ After that, run: go mod tidy"
echo ""
