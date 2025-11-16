# PowerShell script to run E2E tests on Windows
# Usage: .\scripts\test-e2e.ps1

# Prevents terminal from closing automatically
$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up E2E test environment..." -ForegroundColor Cyan

# 1. Start Docker
Write-Host "📦 Starting Docker container..." -ForegroundColor Yellow
npm run test:e2e:setup

# 2. Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 3. Apply migrations
Write-Host "🗄️  Applying migrations..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://prisma:prisma@localhost:5433/tests?schema=public"
npm run test:e2e:migrate

# 4. Run tests
Write-Host "🧪 Running E2E tests..." -ForegroundColor Yellow
npm run test:e2e:run

Write-Host ""
Write-Host "✅ E2E tests completed!" -ForegroundColor Green
Write-Host ""

# Waits for user input before closing
Write-Host "Press Enter to close this terminal..." -ForegroundColor Gray
try {
    Read-Host
} catch {
    # If Read-Host fails, wait 5 seconds
    Start-Sleep -Seconds 5
}

