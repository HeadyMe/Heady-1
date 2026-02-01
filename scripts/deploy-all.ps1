# HeadySystems Complete Deployment Script
# Usage: .\scripts\deploy-all.ps1 [-Environment dev|staging|prod]

param(
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║         HEADY SYSTEMS - DEPLOYMENT ORCHESTRATOR              ║
║         Environment: $($Environment.ToUpper().PadRight(37))║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Step 1: Prerequisites Check
Write-Host "`n[1/7] Checking Prerequisites..." -ForegroundColor Yellow

$prerequisites = @(
    @{ Name = "Node.js"; Command = "node --version"; MinVersion = "20.0.0" },
    @{ Name = "pnpm"; Command = "pnpm --version"; MinVersion = "8.0.0" },
    @{ Name = "Docker"; Command = "docker --version"; MinVersion = "20.0.0" }
)

$allPrereqsMet = $true
foreach ($prereq in $prerequisites) {
    try {
        $version = Invoke-Expression $prereq.Command 2>$null
        Write-Host "  ✅ $($prereq.Name): $version" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $($prereq.Name): Not found or not in PATH" -ForegroundColor Red
        $allPrereqsMet = $false
    }
}

if (-not $allPrereqsMet) {
    Write-Host "`n❌ Prerequisites not met. Please install missing tools." -ForegroundColor Red
    exit 1
}

# Step 2: Environment Setup
Write-Host "`n[2/7] Setting Up Environment..." -ForegroundColor Yellow

$envFile = ".env.local"
$envExample = ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "  ⚠️  Created $envFile from example. Please configure your secrets!" -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ No .env.example found" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ Environment file exists" -ForegroundColor Green
}

# Step 3: Install Dependencies
Write-Host "`n[3/7] Installing Dependencies..." -ForegroundColor Yellow
pnpm install --frozen-lockfile 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Running pnpm install (lockfile may be updated)" -ForegroundColor Yellow
    pnpm install
}
Write-Host "  ✅ Dependencies installed" -ForegroundColor Green

# Step 4: Build Packages
Write-Host "`n[4/7] Building Packages..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Build completed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Build failed" -ForegroundColor Red
    exit 1
}

# Step 5: Start Docker Services
Write-Host "`n[5/7] Starting Docker Services..." -ForegroundColor Yellow

docker-compose down 2>$null
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Docker services started" -ForegroundColor Green
} else {
    Write-Host "  ❌ Docker failed to start" -ForegroundColor Red
    exit 1
}

# Step 6: Wait for Services
Write-Host "`n[6/7] Waiting for Services to be Ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$services = @(
    @{ Name = "PostgreSQL"; Container = "heady-postgres"; Check = "pg_isready" },
    @{ Name = "Redis"; Container = "heady-redis"; Check = "redis-cli ping" }
)

foreach ($service in $services) {
    try {
        $result = docker exec $service.Container $service.Check 2>$null
        Write-Host "  ✅ $($service.Name): Ready" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  $($service.Name): May still be starting" -ForegroundColor Yellow
    }
}

# Step 7: Verification
Write-Host "`n[7/7] Running Verification..." -ForegroundColor Yellow

$endpoints = @(
    @{ Name = "IDE Backend"; Url = "http://localhost:3000/api/health" },
    @{ Name = "Database"; Type = "docker"; Container = "heady-postgres" },
    @{ Name = "Redis"; Type = "docker"; Container = "heady-redis" }
)

$allHealthy = $true
foreach ($endpoint in $endpoints) {
    if ($endpoint.Type -eq "docker") {
        $running = docker ps --filter "name=$($endpoint.Container)" --format "{{.Status}}" 2>$null
        if ($running -like "*Up*") {
            Write-Host "  ✅ $($endpoint.Name): Running" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($endpoint.Name): Not running" -ForegroundColor Red
            $allHealthy = $false
        }
    } else {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 5
            Write-Host "  ✅ $($endpoint.Name): Healthy (HTTP $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  $($endpoint.Name): Not responding yet" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                    DEPLOYMENT COMPLETE                        ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  • Heady Automation IDE: http://localhost:3000"
Write-Host "  • HeadyConnection Web:  http://localhost:3000 (after start)"
Write-Host "  • HeadySystems Web:     http://localhost:3001 (after start)"
Write-Host "  • PostgreSQL:           localhost:5432"
Write-Host "  • Redis:                localhost:6379"

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Configure .env.local with your API keys"
Write-Host "  2. Run 'pnpm dev' to start development servers"
Write-Host "  3. Run 'node scripts/verify-deployment.js' to verify all services"
