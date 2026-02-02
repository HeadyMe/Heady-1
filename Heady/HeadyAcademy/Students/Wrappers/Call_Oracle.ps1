param(
    [Parameter(Mandatory=$false)]
    [string]$Target = ".",
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$BASE = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
ORACLE - Documentation Generator Wrapper

USAGE:
    Call_Oracle.ps1 [-Target <path>]

DESCRIPTION:
    Generates documentation for files or directories using Auto_Doc.py.

PARAMETERS:
    Target  - File or directory to document (default: current directory)

EXAMPLES:
    Call_Oracle.ps1
    Call_Oracle.ps1 -Target "src/core"
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

function Invoke-Oracle {
    param([string]$Path)
    
    $toolPath = "$BASE\Tools\Auto_Doc.py"
    
    if (-not (Test-Python)) { return $false }
    if (-not (Test-Path $toolPath)) {
        Write-Host "ERROR: Auto_Doc tool not found at $toolPath" -ForegroundColor Red
        return $false
    }

    try {
        Write-Host "[ORACLE] Generating documentation for: $Path" -ForegroundColor Cyan
        $output = & python $toolPath $Path 2>&1
        $output | ForEach-Object { Write-Host $_ }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[ORACLE] Documentation Generated Successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[ORACLE] Generation Failed" -ForegroundColor Red
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

$success = Invoke-Oracle -Path $Target

if ($success) {
    exit 0
} else {
    exit 1
}
