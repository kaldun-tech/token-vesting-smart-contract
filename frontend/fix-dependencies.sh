#!/bin/bash
#
# Frontend Dependency Fix Script
# Fixes ESLint compatibility issues and security vulnerabilities
#

set -e  # Exit on error

echo "🔧 Fixing frontend dependencies..."
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")"

echo "1️⃣  Removing old dependencies..."
rm -rf node_modules package-lock.json
echo "   ✅ Cleaned"
echo ""

echo "2️⃣  Installing updated dependencies..."
npm install --legacy-peer-deps
echo "   ✅ Installed"
echo ""

echo "3️⃣  Running security audit..."
npm audit --audit-level=critical || {
    echo "   ⚠️  Critical vulnerabilities found!"
    exit 1
}
echo "   ✅ No critical vulnerabilities"
echo ""

echo "4️⃣  Checking TypeScript..."
npx tsc --noEmit || {
    echo "   ❌ TypeScript errors found!"
    exit 1
}
echo "   ✅ TypeScript OK"
echo ""

echo "5️⃣  Running ESLint..."
npm run lint || {
    echo "   ❌ Linting errors found!"
    exit 1
}
echo "   ✅ Linting OK"
echo ""

echo "6️⃣  Testing production build..."
npm run build || {
    echo "   ❌ Build failed!"
    exit 1
}
echo "   ✅ Build successful"
echo ""

echo "🎉 All checks passed!"
echo ""
echo "Next steps:"
echo "  npm run dev        # Start development server"
echo "  npm start          # Start production server"
