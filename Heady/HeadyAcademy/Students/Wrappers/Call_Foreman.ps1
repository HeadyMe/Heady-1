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
FOREMAN - Consolidation Wrapper

USAGE:
    Call_Foreman.ps1 [-Target <path>] [-OpenReport]

PARAMETERS:
    Target      - Repository or directory to analyze (default: current directory)
    OpenReport  - Open the generated report after completion
    Help        - Show this help message

EXAMPLES:
    Call_Foreman.ps1
    Call_Foreman.ps1 -Target "C:\Projects\MyRepo"
    Call_Foreman.ps1 -Target "." -OpenReport
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
    Write-Host "ERROR: Consolidator tool not found: $ToolPath" -ForegroundColor Red
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

function Invoke-Foreman {
    param(
        [string]$TargetPath,
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Consolidator.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    try {
        $output = & python $toolPath $TargetPath 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Consolidation failed with exit code $exitCode" -ForegroundColor Red
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

Write-Host "[FOREMAN] Analyzing $Target..." -ForegroundColor Cyan

$success = Invoke-Foreman -TargetPath $Target -OpenReport:$OpenReport

if ($success) {
    Write-Host "[FOREMAN] Completed" -ForegroundColor Green
    exit 0
}

Write-Host "[FOREMAN] Failed" -ForegroundColor Red
exit 1
# End of Call_Foreman.ps1
