param(
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$BASE = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
# Project root is HeadySystems (HeadyAcademy is in Heady/HeadyAcademy)
# PSScriptRoot: ...\HeadySystems\Heady\HeadyAcademy\Students\Wrappers
# BASE: ...\HeadySystems\Heady\HeadyAcademy
$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $BASE)
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
NEXUS - Deployment & Remote Operations Wrapper

USAGE:
    Call_Nexus.ps1

DESCRIPTION:
    Initiates the Nexus Deployment Protocol to push changes to the remote origin.
    Wraps scripts/nexus_deploy.ps1.

EXAMPLES:
    Call_Nexus.ps1
"@
}

function Invoke-Nexus {
    $scriptPath = Join-Path $PROJECT_ROOT "scripts\nexus_deploy.ps1"
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "ERROR: Nexus deployment script not found at $scriptPath" -ForegroundColor Red
        return $false
    }

    try {
        Write-Host "[NEXUS] Initiating Deployment Protocol..." -ForegroundColor Cyan
        & $scriptPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[NEXUS] Deployment Sequence Complete" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[NEXUS] Deployment Failed (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

if ($Help) {
    Show-Help
    exit 0
}

$success = Invoke-Nexus

if ($success) {
    exit 0
} else {
    exit 1
}
