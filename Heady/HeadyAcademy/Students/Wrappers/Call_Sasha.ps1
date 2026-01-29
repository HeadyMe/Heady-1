param(
    [Parameter(Mandatory=$false)]
    [string]$Topic = "innovation",

    [Parameter(Mandatory=$false)]
    [switch]$OpenReport,

    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$BASE = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
SASHA - Brainstorming Wrapper

USAGE:
    Call_Sasha.ps1 [-Topic <topic>] [-OpenReport]

PARAMETERS:
    Topic       - Brainstorming topic (default: innovation)
    OpenReport  - Open the generated report after completion
    Help        - Show this help message

EXAMPLES:
    Call_Sasha.ps1
    Call_Sasha.ps1 -Topic "product roadmap"
    Call_Sasha.ps1 -Topic "growth strategy" -OpenReport
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

    if (Test-Path $ToolPath) {
        return $true
    }

    Write-Host "ERROR: Brainstorm tool not found: $ToolPath" -ForegroundColor Red
    return $false
}

function Get-ReportPath {
    param([string[]]$Lines)

    $reportPath = $null
    foreach ($line in $Lines) {
        if ($line -match "Output:\s*(.+)$") {
            $reportPath = $Matches[1].Trim()
        }
    }

    return $reportPath
}

function Invoke-Brainstorm {
    param(
        [string]$Topic,
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Brainstorm.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    if (-not $Topic) {
        $Topic = "innovation"
    }

    try {
        $output = & python $toolPath $Topic 2>&1
        $exitCode = $LASTEXITCODE

        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Brainstorm failed with exit code $exitCode" -ForegroundColor Red
            return $false
        }

        if ($OpenReport) {
            $reportPath = Get-ReportPath -Lines $output
            if ($reportPath) {
                if (Test-Path $reportPath) {
                    Start-Process $reportPath
                } else {
                    Write-Host "WARN: Report not found at $reportPath" -ForegroundColor Yellow
                }
            } else {
                Write-Host "WARN: Report path not detected in output" -ForegroundColor Yellow
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

Write-Host "[SASHA] Brainstorming topic: $Topic" -ForegroundColor Cyan

$success = Invoke-Brainstorm -Topic $Topic -OpenReport:$OpenReport

if ($success) {
    Write-Host "[SASHA] Completed" -ForegroundColor Green
    exit 0
}

Write-Host "[SASHA] Failed" -ForegroundColor Red
exit 1
function Get-ReportPath {
    param([string[]]$Lines)
    foreach ($line in $Lines) {
        if ($line -match "Output:\s*(.+)$") {
            return $Matches[1].Trim()
        }
        if ($line -match "Report:\s*(.+)$") {
            return $Matches[1].Trim()
        }
    }
    return $null
}

function Invoke-Brainstorm {
    param(
        [string]$Topic,
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Brainstorm.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    try {
        $output = & python $toolPath $Topic 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Brainstorm failed with exit code $exitCode" -ForegroundColor Red
            return $false
        }

        if ($OpenReport) {
            $reportPath = Get-ReportPath -Lines $output
            if ($reportPath) {
                if (Test-Path $reportPath) {
                    Start-Process $reportPath
                } else {
                    Write-Host "WARN: Report not found at $reportPath" -ForegroundColor Yellow
                }
            } else {
                Write-Host "WARN: Report path not detected in output" -ForegroundColor Yellow
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

Write-Host "[SASHA] Brainstorming topic: $Topic..." -ForegroundColor Cyan

$success = Invoke-Brainstorm -Topic $Topic -OpenReport:$OpenReport

if ($success) {
    Write-Host "[SASHA] Completed" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[SASHA] Failed" -ForegroundColor Red
    exit 1
}
# Remove duplicate function definitions
if (Test-Path Function:\Get-ReportPath) {
    Remove-Item Function:\Get-ReportPath -Force
}
if (Test-Path Function:\Invoke-Brainstorm) {
    Remove-Item Function:\Invoke-Brainstorm -Force
}

# Consolidate into single, improved version
function Get-ReportPath {
    param([string[]]$Lines)
    
    foreach ($line in $Lines) {
        if ($line -match "Output:\s*(.+)$|Report:\s*(.+)$") {
            return $Matches[1] ?? $Matches[2] -replace '^\s+|\s+$'
        }
    }
    return $null
}

function Invoke-Brainstorm {
    param(
        [string]$Topic = "innovation",
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Brainstorm.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    try {
        $output = & python $toolPath $Topic 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Brainstorm failed with exit code $exitCode" -ForegroundColor Red
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
#Requires -Version 5.1
<#
.SYNOPSIS
    HeadyAcademy Launcher
.DESCRIPTION
    Main entry point for HeadyAcademy system
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$Topic = "innovation",

    [Parameter(Mandatory=$false)]
    [switch]$OpenReport,

    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$BASE = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
SASHA - Brainstorming Wrapper

USAGE:
    Call_Sasha.ps1 [-Topic <topic>] [-OpenReport]

PARAMETERS:
    Topic       - Brainstorming topic (default: innovation)
    OpenReport  - Open the generated report after completion
    Help        - Show this help message

EXAMPLES:
    Call_Sasha.ps1
    Call_Sasha.ps1 -Topic "product roadmap"
    Call_Sasha.ps1 -Topic "growth strategy" -OpenReport
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
    Write-Host "ERROR: Brainstorm tool not found: $ToolPath" -ForegroundColor Red
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

function Invoke-Brainstorm {
    param(
        [string]$Topic = "innovation",
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Brainstorm.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    try {
        $output = & python $toolPath $Topic 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Brainstorm failed with exit code $exitCode" -ForegroundColor Red
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

Write-Host "[SASHA] Brainstorming topic: $Topic..." -ForegroundColor Cyan

$success = Invoke-Brainstorm -Topic $Topic -OpenReport:$OpenReport

if ($success) {
    Write-Host "[SASHA] Completed" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[SASHA] Failed" -ForegroundColor Red
    exit 1
}


# Cleanup functions to avoid leaking into caller scope when dot-sourced
if (Test-Path Function:\Show-Help)        { Remove-Item Function:\Show-Help -Force }
if (Test-Path Function:\Test-Python)      { Remove-Item Function:\Test-Python -Force }
if (Test-Path Function:\Test-ToolExists)  { Remove-Item Function:\Test-ToolExists -Force }
if (Test-Path Function:\Get-ReportPath)   { Remove-Item Function:\Get-ReportPath -Force }
if (Test-Path Function:\Invoke-Brainstorm){ Remove-Item Function:\Invoke-Brainstorm -Force }
# End of Call_Sasha.ps1
