# HEADY SYSTEM LAUNCHER
# Updated to use extracted tools library

$ErrorActionPreference = "Stop"

Write-Host "∞ IGNITING HEADY SYSTEM ∞" -ForegroundColor Cyan

# Import core tools
if (Test-Path ".\tools\scripts\HeadyCore.psm1") {
    Import-Module ".\tools\scripts\HeadyCore.psm1" -Force
    Write-Host "✓ Core tools loaded" -ForegroundColor Green
    
    # Initialize secrets using extracted tool
    Initialize-HeadySecrets
} else {
    Write-Host "! Core tools not found, using fallback" -ForegroundColor Yellow
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match '^([A-Z_][A-Z0-9_]+)=(.*)') {
                [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
            }
        }
    }
}

# Start the Sacred Interface
Write-Host "`nStarting Sacred Interface..." -ForegroundColor Green
Start-Process "http://localhost:3300"

Write-Host "Starting Node.js Manager..." -ForegroundColor Green
npm start