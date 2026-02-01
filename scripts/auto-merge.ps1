# PowerShell Auto-Merge Script for Windsurf Arena Mode
# Automates intelligent merging of code changes

param(
    [Parameter(Mandatory=$true)]
    [string]$LeftPath,
    
    [Parameter(Mandatory=$true)]
    [string]$RightPath,
    
    [Parameter(Mandatory=$true)]
    [string]$OutputPath,
    
    [switch]$Verbose,
    [switch]$PreferOlder,
    [switch]$PreferShorter,
    [switch]$NoTypes,
    [switch]$DryRun
)

Write-Host "🔄 Intelligent Auto-Merge" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Build arguments for Node.js script
$args = @($LeftPath, $RightPath, $OutputPath)

if ($Verbose) { $args += "--verbose" }
if ($PreferOlder) { $args += "--prefer-older" }
if ($PreferShorter) { $args += "--prefer-shorter" }
if ($NoTypes) { $args += "--no-types" }

# Check if Node.js script exists
$scriptPath = Join-Path $PSScriptRoot "auto-merge.js"
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ auto-merge.js not found at: $scriptPath" -ForegroundColor Red
    exit 1
}

# Dry run check
if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No files will be modified" -ForegroundColor Yellow
    Write-Host "   Command: node $scriptPath $($args -join ' ')" -ForegroundColor Gray
    Write-Host ""
    
    # Show what would be merged
    Write-Host "Would merge:" -ForegroundColor Yellow
    Write-Host "   Left:   $LeftPath" -ForegroundColor Gray
    Write-Host "   Right:  $RightPath" -ForegroundColor Gray
    Write-Host "   Output: $OutputPath" -ForegroundColor Gray
    exit 0
}

# Execute merge
try {
    node $scriptPath @args
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Merge completed successfully!" -ForegroundColor Green
        Write-Host "   Output: $OutputPath" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "❌ Merge failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error executing merge: $_" -ForegroundColor Red
    exit 1
}
