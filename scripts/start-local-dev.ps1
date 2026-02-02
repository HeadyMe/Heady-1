<#
.SYNOPSIS
    Starts the Heady Ecosystem in "Local-First" mode.
    - Infrastructure (DB, Redis, OTel) runs in Docker.
    - Applications (IDE, Web) run as native local Node.js processes.
    - Bypasses Docker networking issues and improves iteration speed.

.EXAMPLE
    .\scripts\start-local-dev.ps1
#>

Write-Host "🌀 Initializing Heady Local-First Protocol..." -ForegroundColor Cyan

# 1. Check Prerequisites
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is required for infrastructure (DB/Redis). Please install Docker Desktop."
    exit 1
}

if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm is required. Please install it (npm i -g pnpm)."
    exit 1
}

# 2. Start Infrastructure (Background)
Write-Host "🏗️  Spinning up Infrastructure (Postgres, Redis, OTel)..." -ForegroundColor Yellow
docker-compose up -d db redis otel-collector

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start infrastructure."
    exit 1
}

# 3. Wait for DB availability (Simple pause, or we could poll)
Write-Host "⏳ Waiting for Database to be ready..." -ForegroundColor DarkGray
Start-Sleep -Seconds 5

# 4. Install Dependencies (Fast check)
Write-Host "📦 Verifying dependencies..." -ForegroundColor Yellow
pnpm install --reporter=silent

# 5. Start Applications
Write-Host "🚀 Launching Applications (Native Mode)..." -ForegroundColor Green
Write-Host "   - Heady Automation IDE: http://localhost:5173 (UI) | http://localhost:4100 (API)"
Write-Host "   - Press Ctrl+C to stop all services." -ForegroundColor Gray

# Use turbo to run dev scripts in parallel, filtering for specific apps if needed
# We run 'dev' in all packages/apps.
pnpm dev
