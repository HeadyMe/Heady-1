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
OCULUS - Visualization Wrapper

USAGE:
    Call_Oculus.ps1 [-Target <path>] [-OpenReport]

PARAMETERS:
    Target      - Directory to visualize (default: current directory)
    OpenReport  - Open the generated visualization after completion
    Help        - Show this help message

EXAMPLES:
    Call_Oculus.ps1
    Call_Oculus.ps1 -Target ".\src"
    Call_Oculus.ps1 -Target "C:\Projects\MyApp" -OpenReport
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
    Write-Host "ERROR: Visualizer tool not found: $ToolPath" -ForegroundColor Red
    return $false
}

function Get-ReportPath {
    param([string[]]$Lines)
    foreach ($line in $Lines) {
        if ($line -match "Output:\s*(.+)$") {
            return $Matches[1].Trim()
        }
    }
    return $null
}

function Invoke-Oculus {
    param(
        [string]$TargetPath,
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Visualizer.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    try {
        $output = & python $toolPath $TargetPath 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Visualization failed with exit code $exitCode" -ForegroundColor Red
            return $false
        }

        if ($OpenReport) {
            $reportPath = Get-ReportPath -Lines $output
            if ($reportPath -and (Test-Path $reportPath)) {
                Start-Process $reportPath
            } else {
                Write-Host "WARN: Output path not detected" -ForegroundColor Yellow
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

Write-Host "[OCULUS] Visualizing $Target..." -ForegroundColor Cyan

$success = Invoke-Oculus -TargetPath $Target -OpenReport:$OpenReport

if ($success) {
    Write-Host "[OCULUS] Completed" -ForegroundColor Green
    exit 0
}

Write-Host "[OCULUS] Failed" -ForegroundColor Red
exit 1
