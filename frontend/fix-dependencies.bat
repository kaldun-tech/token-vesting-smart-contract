@echo off
REM Frontend Dependency Fix Script (Windows)
REM Fixes ESLint compatibility issues and security vulnerabilities

echo.
echo 🔧 Fixing frontend dependencies...
echo.

echo 1️⃣  Removing old dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json
echo    ✅ Cleaned
echo.

echo 2️⃣  Installing updated dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo    ❌ Installation failed!
    exit /b 1
)
echo    ✅ Installed
echo.

echo 3️⃣  Running security audit...
call npm audit --audit-level=critical
if errorlevel 1 (
    echo    ⚠️  Critical vulnerabilities found!
    exit /b 1
)
echo    ✅ No critical vulnerabilities
echo.

echo 4️⃣  Checking TypeScript...
call npx tsc --noEmit
if errorlevel 1 (
    echo    ❌ TypeScript errors found!
    exit /b 1
)
echo    ✅ TypeScript OK
echo.

echo 5️⃣  Running ESLint...
call npm run lint
if errorlevel 1 (
    echo    ❌ Linting errors found!
    exit /b 1
)
echo    ✅ Linting OK
echo.

echo 6️⃣  Testing production build...
call npm run build
if errorlevel 1 (
    echo    ❌ Build failed!
    exit /b 1
)
echo    ✅ Build successful
echo.

echo 🎉 All checks passed!
echo.
echo Next steps:
echo   npm run dev        # Start development server
echo   npm start          # Start production server
echo.
