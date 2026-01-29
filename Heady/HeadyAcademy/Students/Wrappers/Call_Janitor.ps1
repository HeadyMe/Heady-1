param(
    [Parameter(Mandatory=$false)]
    [string]$Target = ".",

    [Parameter(Mandatory=$false)]
    [switch]$DryRun,

    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$BASE = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
JANITOR - Cleanup Wrapper

USAGE:
    Call_Janitor.ps1 [-Target <path>] [-DryRun]

PARAMETERS:
    Target   - Directory to clean (default: current directory)
    DryRun   - Preview what would be deleted without removing files
    Help     - Show this help message

EXAMPLES:
    Call_Janitor.ps1
    Call_Janitor.ps1 -Target ".\Logs"
    Call_Janitor.ps1 -Target ".\Build" -DryRun
"@
}

function Test-Python {
    try {
        $null = Get-Command python -ErrorAction Stop
        return $true
    } catch {
        Write-Host "ERROR: Python not found in PATH" -ForegroundColor Red
        return $false
    }
}

function Test-ToolExists {
    param([string]$ToolPath)
    if (Test-Path $ToolPath) { return $true }
    Write-Host "ERROR: Clean_Sweep tool not found: $ToolPath" -ForegroundColor Red
    return $false
}

function Invoke-Janitor {
    param(
        [string]$TargetPath,
        [switch]$DryRun
    )

    $toolPath = "$BASE\Tools\Clean_Sweep.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    $cmdArgs = @($TargetPath)
    if ($DryRun) { $cmdArgs += "--dry" }

    try {
        $output = & python $toolPath @cmdArgs 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Janitor failed with exit code $exitCode" -ForegroundColor Red
            return $false
        }
        return $true
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

if ($Help) {
    Show-Help
    exit 0
}

Write-Host "[JANITOR] Cleaning $Target..." -ForegroundColor Cyan

$success = Invoke-Janitor -TargetPath $Target -DryRun:$DryRun

if ($success) {
    Write-Host "[JANITOR] Completed" -ForegroundColor Green
    exit 0
}

Write-Host "[JANITOR] Failed" -ForegroundColor Red
exit 1
