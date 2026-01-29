# HEADY CORE SCRIPTS LIBRARY
# Consolidated PowerShell utilities for system management

# Secret Management
function Initialize-HeadySecrets {
    param([string]$EnvFile = ".env")
    
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^([A-Z_][A-Z0-9_]+)=(.*)') {
                [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
            }
        }
        Write-Host "✓ Secrets loaded from $EnvFile" -ForegroundColor Green
    }
}

# Git Automation
function Optimize-HeadyRepo {
    git add -A
    git commit -m "Automated optimization: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ErrorAction SilentlyContinue
    git gc --aggressive --prune=now
    Write-Host "✓ Repository optimized" -ForegroundColor Green
}

# System Scaffolding
function Initialize-HeadyProject {
    $dirs = @("src", "public", "docs", ".github/workflows")
    foreach ($d in $dirs) {
        New-Item -ItemType Directory -Force -Path $d | Out-Null
        Write-Host "✓ Created: $d" -ForegroundColor Green
    }
}

# Remote Configuration
function Setup-HeadyRemotes {
    $remotes = @{
        "origin" = "https://github.com/HeadyMe/HeadySystems.git"
        "heady-me" = "https://github.com/HeadyMe/Heady.git"
    }
    
    foreach ($name in $remotes.Keys) {
        git remote remove $name 2>$null
        git remote add $name $remotes[$name]
        Write-Host "✓ Added remote: $name" -ForegroundColor Green
    }
}

Export-ModuleMember -Function Initialize-HeadySecrets, Optimize-HeadyRepo, Initialize-HeadyProject, Setup-HeadyRemotes