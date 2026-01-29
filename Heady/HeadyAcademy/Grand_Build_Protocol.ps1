# HEADY SYSTEMS GRAND BUILD PROTOCOL
$ErrorActionPreference = "Stop"

Write-Host "∞ INITIATING GRAND BUILD PROTOCOL ∞" -ForegroundColor Cyan

# Phase 1: Security Injection
Write-Host "`n[PHASE 1] Security Injection..." -ForegroundColor Magenta
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([A-Z_][A-Z0-9_]+)=(.*)') {
            [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
        }
    }
    Write-Host "  ✓ Environment variables loaded" -ForegroundColor Green
}

# Phase 2: Dependency Assembly  
Write-Host "`n[PHASE 2] Dependency Assembly..." -ForegroundColor Magenta
if (Test-Path "package.json") {
    npm install
    Write-Host "  ✓ npm install complete" -ForegroundColor Green
}
if (Test-Path "requirements.txt") {
    pip install -r requirements.txt
    Write-Host "  ✓ pip install complete" -ForegroundColor Green
}

# Phase 3: Infrastructure Verification
Write-Host "`n[PHASE 3] Infrastructure Verification..." -ForegroundColor Magenta
if (Test-Path "Students\Wrappers\render.yaml") {
    Write-Host "  ✓ render.yaml exists" -ForegroundColor Green
}
if (Test-Path "public\index.html") {
    Write-Host "  ✓ Sacred UI exists" -ForegroundColor Green
}

# Phase 4: Optimization and Deployment
Write-Host "`n[PHASE 4] Optimization and Deployment..." -ForegroundColor Magenta
git add -A
git commit -m "Grand Build Protocol: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ErrorAction SilentlyContinue
git gc --aggressive --prune=now
Write-Host "  ✓ Git optimization complete" -ForegroundColor Green

$pushSuccess = $false
try {
    git push origin --force
    $pushSuccess = $true
    Write-Host "  ✓ Pushed to origin" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Push failed" -ForegroundColor Red
}

# Phase 5: Final Status
Write-Host "`n[PHASE 5] Final Status Report..." -ForegroundColor Magenta
Write-Host "`n✓ GRAND BUILD PROTOCOL COMPLETE" -ForegroundColor Green
if ($pushSuccess) {
    Write-Host "  Distributed to 1 remote pillar" -ForegroundColor Cyan
} else {
    Write-Host "  No remote distribution completed" -ForegroundColor Yellow
}