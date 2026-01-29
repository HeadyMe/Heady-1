param(
    [Parameter(Mandatory=$false)]
    [string]$Tool = "python",

    [Parameter(Mandatory=$false)]
    [switch]$OpenReport,

    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$BASE = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
SOPHIA - Tool Learning Wrapper

USAGE:
    Call_Sophia.ps1 [-Tool <name>] [-OpenReport]

PARAMETERS:
    Tool        - Name of the tool to learn about (default: python)
    OpenReport  - Open the generated documentation after completion
    Help        - Show this help message

EXAMPLES:
    Call_Sophia.ps1
    Call_Sophia.ps1 -Tool git
    Call_Sophia.ps1 -Tool docker -OpenReport
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
    Write-Host "ERROR: Tool_Learner not found: $ToolPath" -ForegroundColor Red
    return $false
}

function Get-ReportPath {
    param([string[]]$Lines)
    foreach ($line in $Lines) {
        if ($line -match "Documentation:\s*(.+)$") {
            return $Matches[1].Trim()
        }
    }
    return $null
}

function Invoke-Sophia {
    param(
        [string]$ToolName,
        [switch]$OpenReport
    )

    $toolPath = "$BASE\Tools\Tool_Learner.py"

    if (-not (Test-Python)) { return $false }
    if (-not (Test-ToolExists $toolPath)) { return $false }

    try {
        $output = & python $toolPath $ToolName 2>&1
        $exitCode = $LASTEXITCODE
        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -ne 0) {
            Write-Host "ERROR: Tool learning failed with exit code $exitCode" -ForegroundColor Red
            return $false
        }

        if ($OpenReport) {
            $reportPath = Get-ReportPath -Lines $output
            if ($reportPath -and (Test-Path $reportPath)) {
                Start-Process $reportPath
            } else {
                Write-Host "WARN: Documentation path not detected" -ForegroundColor Yellow
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

Write-Host "[SOPHIA] Learning tool: $Tool..." -ForegroundColor Cyan

$success = Invoke-Sophia -ToolName $Tool -OpenReport:$OpenReport

if ($success) {
    Write-Host "[SOPHIA] Completed" -ForegroundColor Green
    exit 0
}

Write-Host "[SOPHIA] Failed" -ForegroundColor Red
exit 1


# Allow script to be dot-sourced without auto-executing main logic
if ($MyInvocation.InvocationName -eq ".") {
    Write-Verbose "Call_Sophia.ps1 loaded (no execution in dot-source mode)"
}
Export-ModuleMember -Function * -ErrorAction SilentlyContinue
# Main execution logic
if (-not $Help) {
    $success = Invoke-Sophia -ToolName $Tool -OpenReport:$OpenReport
    
    if ($success) {
        Write-Host "[SOPHIA] Completed" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "[SOPHIA] Failed" -ForegroundColor Red
    exit 1
}
# Remove duplicate function definitions and execution blocks
if (Test-Path Function:\Invoke-Sophia) {
    Remove-Item Function:\Invoke-Sophia -Force
}
if (Test-Path Function:\Get-ReportPath) {
    Remove-Item Function:\Get-ReportPath -Force
}
if (Test-Path Function:\Test-Python) {
    Remove-Item Function:\Test-Python -Force
}
if (Test-Path Function:\Test-ToolExists) {
    Remove-Item Function:\Test-ToolExists -Force
}
if (Test-Path Function:\Show-Help) {
    Remove-Item Function:\Show-Help -Force
}
# End of Call_Sophia.ps1


# Ensure script can be dot-sourced without auto-executing main logic
if ($MyInvocation.InvocationName -eq ".") {
    Write-Verbose "Call_Sophia.ps1 loaded (no execution in dot-source mode)"
    return
}

# Main execution logic
if (-not $Help) {
    $success = Invoke-Sophia -ToolName $Tool -OpenReport:$OpenReport
    
    if ($success) {
        Write-Host "[SOPHIA] Completed" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "[SOPHIA] Failed" -ForegroundColor Red
    exit 1
}
# Remove duplicate function definitions and execution blocks
if (Test-Path Function:\Invoke-Sophia) {
    Remove-Item Function:\Invoke-Sophia -Force
}
if (Test-Path Function:\Get-ReportPath) {
    Remove-Item Function:\Get-ReportPath -Force
}
if (Test-Path Function:\Test-Python) {
    Remove-Item Function:\Test-Python -Force
}
if (Test-Path Function:\Test-ToolExists) {
    Remove-Item Function:\Test-ToolExists -Force
}
if (Test-Path Function:\Show-Help) {
    Remove-Item Function:\Show-Help -Force
}

# End of Call_Sophia.ps1
# Main execution logic
if (-not $Help) {
    $success = Invoke-Sophia -ToolName $Tool -OpenReport:$OpenReport
    
    if ($success) {
        Write-Host "[SOPHIA] Completed" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "[SOPHIA] Failed" -ForegroundColor Red
    exit 1
}
# Final validation run
Write-Host "[SOPHIA] Performing final validation..." -ForegroundColor Cyan

# Verify all functions are properly defined
$requiredFunctions = @('Show-Help', 'Test-Python', 'Test-ToolExists', 'Get-ReportPath', 'Invoke-Sophia')
$allValid = $true

foreach ($func in $requiredFunctions) {
    if (-not (Test-Path "Function:\$func")) {
        Write-Host "WARN: Function $func not available" -ForegroundColor Yellow
        $allValid = $false
    }
}

if ($allValid) {
    Write-Host "[SOPHIA] All functions validated successfully" -ForegroundColor Green
} else {
    Write-Host "[SOPHIA] Some functions missing - script may need reload" -ForegroundColor Yellow
}

# Cleanup functions to prevent scope leakage
if (Test-Path Function:\Invoke-Sophia)   { Remove-Item Function:\Invoke-Sophia -Force }
if (Test-Path Function:\Get-ReportPath)  { Remove-Item Function:\Get-ReportPath -Force }
if (Test-Path Function:\Test-Python)     { Remove-Item Function:\Test-Python -Force }
if (Test-Path Function:\Test-ToolExists) { Remove-Item Function:\Test-ToolExists -Force }
if (Test-Path Function:\Show-Help)       { Remove-Item Function:\Show-Help -Force }

# End of Call_Sophia.ps1
