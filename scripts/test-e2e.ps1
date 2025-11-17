# PowerShell script to run E2E tests on Windows
# Usage: .\scripts\test-e2e.ps1

# Prevents terminal from closing automatically
$ErrorActionPreference = "Stop"

# Ensure we're in the project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

Write-Host "🚀 Setting up E2E test environment..." -ForegroundColor Cyan
Write-Host "  Working directory: $(Get-Location)" -ForegroundColor Gray

# 1. Start Docker
Write-Host "📦 Starting Docker container..." -ForegroundColor Yellow
npm run test:e2e:setup

# 2. Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 3. Apply migrations
Write-Host "🗄️  Applying migrations..." -ForegroundColor Yellow
$testDbUrl = "postgresql://prisma:prisma@localhost:5433/tests?schema=public"
# Use .env.test for migrations (temporarily replace .env)
if (Test-Path ".env.test") {
    $envBackup = $null
    if (Test-Path ".env") {
        $envBackup = Get-Content ".env" -Raw
    }
    # Read .env.test and ensure DATABASE_URL and DIRECT_URL are set correctly
    $envTestContent = Get-Content ".env.test" -Raw
    # Replace or add DATABASE_URL
    if ($envTestContent -match "DATABASE_URL\s*=") {
        $envTestContent = $envTestContent -replace "DATABASE_URL\s*=.*", "DATABASE_URL=$testDbUrl"
    } else {
        $envTestContent = $envTestContent + "`nDATABASE_URL=$testDbUrl"
    }
    # Replace or add DIRECT_URL (same as DATABASE_URL for tests)
    if ($envTestContent -match "DIRECT_URL\s*=") {
        $envTestContent = $envTestContent -replace "DIRECT_URL\s*=.*", "DIRECT_URL=$testDbUrl"
    } else {
        $envTestContent = $envTestContent + "`nDIRECT_URL=$testDbUrl"
    }
    # Write to .env
    Set-Content ".env" -Value $envTestContent -NoNewline
    Write-Host "  (Using .env.test for migration with test database)" -ForegroundColor Gray
    # Verify the .env was updated correctly
    Write-Host "  Verifying .env configuration..." -ForegroundColor Gray
    Get-Content ".env" | Select-String -Pattern "^(DATABASE_URL|DIRECT_URL)=" | Select-Object -First 2
    try {
        npm run test:e2e:migrate
    } finally {
        # Restore original .env if it existed
        if ($envBackup) {
            Set-Content ".env" -Value $envBackup -NoNewline
            Write-Host "  (Restored original .env)" -ForegroundColor Gray
        } elseif (Test-Path ".env") {
            Remove-Item ".env" -Force
        }
    }
} else {
    Write-Host "  Warning: .env.test not found!" -ForegroundColor Yellow
    Write-Host "  Please create .env.test with DATABASE_URL for tests" -ForegroundColor Yellow
    exit 1
}

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

