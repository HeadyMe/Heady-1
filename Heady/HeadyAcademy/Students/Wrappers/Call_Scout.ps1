param(
    [Parameter(Mandatory=$false)]
    [string]$Query = "heady systems",

    [Parameter(Mandatory=$false)]
    [switch]$OpenReport,

    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$BASE = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
SCOUT - GitHub Scanner Wrapper

USAGE:
    Call_Scout.ps1 [-Query <search>] [-OpenReport]

PARAMETERS:
    Query       - Search query for GitHub (default: heady systems)
    OpenReport  - Open the generated report after completion
    Help        - Show this help message

ENVIRONMENT:
    GITHUB_TOKEN - Optional GitHub API token for higher rate limits

EXAMPLES:
    Call_Scout.ps1
    Call_Scout.ps1 -Query "python automation"
    Call_Scout.ps1 -Query "machine learning" -OpenReport
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
    Write-Host "ERROR: Github_Scanner tool not found: $ToolPath" -ForegroundColor Red
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

function Invoke-Scout {
    param(
        [string]$SearchQuery,
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Github_Scanner.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    try {
        $output = & python $toolPath $SearchQuery 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: GitHub scan failed with exit code $exitCode" -ForegroundColor Red
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

Write-Host "[SCOUT] Searching GitHub for: $Query..." -ForegroundColor Cyan

$success = Invoke-Scout -SearchQuery $Query -OpenReport:$OpenReport

if ($success) {
    Write-Host "[SCOUT] Completed" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[SCOUT] Failed" -ForegroundColor Red
    exit 1
}