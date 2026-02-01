param(
    [Parameter(Mandatory=$false)]
    [string]$Target = ".",

    [Parameter(Mandatory=$false)]
    [switch]$OpenReport,

    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$BASE = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
MURPHY - Security Audit Wrapper

USAGE:
    Call_Murphy.ps1 [-Target <path>] [-OpenReport]

PARAMETERS:
    Target      - File or directory to audit (default: current directory)
    OpenReport  - Open the generated report after completion
    Help        - Show this help message

EXAMPLES:
    Call_Murphy.ps1
    Call_Murphy.ps1 -Target ".\src"
    Call_Murphy.ps1 -Target ".\app.py" -OpenReport
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
    Write-Host "ERROR: Security_Audit tool not found: $ToolPath" -ForegroundColor Red
    return $false
}

function Get-ReportPath {
    param([string[]]$Lines)
    foreach ($line in $Lines) {
        if ($line -match "Report:\s*(.+)$") {
            return $Matches[1].Trim()
        }
    }
    return $null
}

function Invoke-Murphy {
    param(
        [string]$TargetPath,
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Security_Audit.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    try {
        $output = & python $toolPath $TargetPath 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Security audit failed with exit code $exitCode" -ForegroundColor Red
            return $false
        }

        if ($OpenReport) {
            $reportPath = Get-ReportPath -Lines $output
            if ($reportPath -and (Test-Path $reportPath)) {
                Start-Process $reportPath
            } else {
                Write-Host "WARN: Report path not detected" -ForegroundColor Yellow
            }
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

Write-Host "[MURPHY] Running security audit on $Target..." -ForegroundColor Cyan

$success = Invoke-Murphy -TargetPath $Target -OpenReport:$OpenReport

if ($success) {
    Write-Host "[MURPHY] Completed" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[MURPHY] Failed" -ForegroundColor Red
    exit 1
}
