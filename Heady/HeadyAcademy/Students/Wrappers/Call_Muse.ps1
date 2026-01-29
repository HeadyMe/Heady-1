param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("whitepaper", "marketing", "data")]
    [string]$Mode = "marketing",

    [Parameter(Mandatory=$false)]
    [string]$Subject = "HeadySystems",

    [Parameter(Mandatory=$false)]
    [switch]$OpenReport,

    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$BASE = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
MUSE - Content Generation Wrapper

USAGE:
    Call_Muse.ps1 [-Mode <type>] [-Subject <topic>] [-OpenReport]

PARAMETERS:
    Mode        - Content type: whitepaper, marketing, data (default: marketing)
    Subject     - Topic for the content (default: HeadySystems)
    OpenReport  - Open the generated content after completion
    Help        - Show this help message

EXAMPLES:
    Call_Muse.ps1
    Call_Muse.ps1 -Mode whitepaper -Subject "AI Integration"
    Call_Muse.ps1 -Mode data -Subject "User Analytics" -OpenReport
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
    Write-Host "ERROR: Content_Generator tool not found: $ToolPath" -ForegroundColor Red
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

function Invoke-Muse {
    param(
        [string]$ContentMode,
        [string]$ContentSubject,
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Content_Generator.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    try {
        $output = & python $toolPath $ContentMode $ContentSubject 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Content generation failed with exit code $exitCode" -ForegroundColor Red
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

Write-Host "[MUSE] Generating $Mode content for '$Subject'..." -ForegroundColor Cyan

$success = Invoke-Muse -ContentMode $Mode -ContentSubject $Subject -OpenReport:$OpenReport

if ($success) {
    Write-Host "[MUSE] Completed" -ForegroundColor Green
    exit 0
}

Write-Host "[MUSE] Failed" -ForegroundColor Red
exit 1
The script is already complete and well-structured. Looking at the code, it follows the same patterns as the other wrapper scripts and is fully functional. No additional code is needed after `exit 1` - the script properly handles all cases:

1. Help display
2. Success path with exit 0
3. Failure path with exit 1

The script is optimized and follows best practices consistent with the other wrappers (Call_Foreman, Call_Murphy, Call_Atlas, etc.). No changes or additions are required.
