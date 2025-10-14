#!/bin/bash

echo "🔧 Fixing ESM Module Error"
echo "=========================="
echo ""

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
echo "Current Node.js version: $(node --version)"

if [ "$NODE_VERSION" -ge 20 ]; then
    echo "✅ Node.js 20+ detected - using latest packages"
    RAINBOWKIT_VERSION="^2.1.0"
    VIEM_VERSION="^2.7.0"
    WAGMI_VERSION="^2.5.0"
else
    echo "⚠️  Node.js 18 detected - using compatible packages"
    echo "   Recommendation: Upgrade to Node.js 20+ for best experience"
    echo "   Download from: https://nodejs.org/"
    RAINBOWKIT_VERSION="^2.0.0"
    VIEM_VERSION="2.7.15"
    WAGMI_VERSION="^2.5.7"
fi

echo ""
echo "📦 Cleaning old dependencies..."
rm -rf node_modules package-lock.json .next

echo ""
echo "📥 Installing compatible dependencies..."
echo "   - @rainbow-me/rainbowkit@$RAINBOWKIT_VERSION"
echo "   - viem@$VIEM_VERSION"
echo "   - wagmi@$WAGMI_VERSION"
echo ""

npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🚀 Start the dev server with:"
    echo "   npm run dev"
    echo ""
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Try manually:"
    echo "  1. rm -rf node_modules package-lock.json"
    echo "  2. npm install --legacy-peer-deps"
    echo ""
    echo "If issues persist, see FIX_ESM_ERROR.md for more solutions"
    echo ""
fi
