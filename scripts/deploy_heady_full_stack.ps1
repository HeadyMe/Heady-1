# scripts/deploy_heady_full_stack.ps1
# HeadySystems Complete Deployment Script

$ErrorActionPreference = "Continue"

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║         HEADY SYSTEMS - FULL STACK DEPLOYMENT                ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $idx = $line.IndexOf('=')
            if ($idx -gt 0) {
                $key = $line.Substring(0, $idx).Trim()
                $value = $line.Substring($idx + 1)
                if ($key) {
                    [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
                }
            }
        }
    }
}

$idePort = if ($env:PORT) { $env:PORT } else { 3000 }

# Step 1: Prerequisites Check
Write-Host "`n[1/6] Checking Prerequisites..." -ForegroundColor Yellow
$prereqOk = $true

try { $nodeVer = node --version; Write-Host "  ✅ Node.js: $nodeVer" -ForegroundColor Green } 
catch { Write-Host "  ❌ Node.js: Not found" -ForegroundColor Red; $prereqOk = $false }

try { $pnpmVer = pnpm --version; Write-Host "  ✅ pnpm: $pnpmVer" -ForegroundColor Green }
catch { Write-Host "  ❌ pnpm: Not found" -ForegroundColor Red; $prereqOk = $false }

try { $dockerVer = docker --version; Write-Host "  ✅ Docker: $dockerVer" -ForegroundColor Green }
catch { Write-Host "  ❌ Docker: Not found" -ForegroundColor Red; $prereqOk = $false }

if (-not $prereqOk) {
    Write-Host "`n⚠️  Some prerequisites missing. Continuing anyway..." -ForegroundColor Yellow
}

# Step 2: Diagnose / Secrets
Write-Host "`n[2/6] Checking Secrets..." -ForegroundColor Yellow
if (Test-Path "scripts/generate_missing_secrets.py") {
    python scripts/generate_missing_secrets.py 2>$null
}
if (Test-Path "scripts/audit_secrets.ps1") {
    ./scripts/audit_secrets.ps1
}

# Step 3: Install Dependencies
Write-Host "`n[3/6] Installing Dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Some dependency issues (continuing)" -ForegroundColor Yellow
}

# Step 4: Build
Write-Host "`n[4/6] Building Project..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Build completed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Build had issues (continuing)" -ForegroundColor Yellow
}

# Step 5: Docker Environment
Write-Host "`n[5/6] Starting Docker Environment..." -ForegroundColor Yellow
docker-compose down 2>$null
docker-compose up -d --build

# Step 6: Verify
Write-Host "`n[6/6] Verifying Deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check Docker containers
$servicesToCheck = @("db", "redis", "ide")
if ($env:TUNNEL_TOKEN) {
    $servicesToCheck += "tunnel"
}

foreach ($service in $servicesToCheck) {
    $containerId = docker-compose ps -q $service 2>$null
    if (-not $containerId) {
        Write-Host "  ❌ $service : Not found" -ForegroundColor Red
        continue
    }

    $state = docker inspect -f "{{.State.Status}}" $containerId 2>$null
    if ($state -eq "running") {
        Write-Host "  ✅ $service : Running" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $service : $state" -ForegroundColor Red
    }
}

# Check HTTP endpoints
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ IDE Backend: Healthy" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  IDE Backend: HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  IDE Backend: Not responding (start with 'pnpm dev')" -ForegroundColor Yellow
}

# Summary
Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                   DEPLOYMENT COMPLETE                         ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  • Heady Automation IDE: http://localhost:$idePort"
Write-Host "  • HeadyConnection Web:  http://localhost:3002 (after start)"
Write-Host "  • HeadySystems Web:     http://localhost:3003 (after start)"
Write-Host "  • PostgreSQL:           localhost:5432"
Write-Host "  • Redis:                localhost:6379"

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Start dev servers: pnpm dev --filter heady-automation-ide"
Write-Host "  2. Verify services:   python scripts/verify_full_stack.py"
Write-Host "  3. View logs:         docker-compose logs -f"
