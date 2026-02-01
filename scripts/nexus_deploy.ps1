# HEADY NEXUS DEPLOYMENT PROTOCOL
$pushResults = @{}

Write-Host "INFINITY INITIATING NEXUS DEPLOYMENT INFINITY" -ForegroundColor Cyan

# Configure origin remote
try {
    $existing = git remote get-url origin 2>$null
    if (-not $existing) {
        git remote add origin "https://github.com/HeadyMe/HeadySystems.git"
        Write-Host "  + Added remote: origin" -ForegroundColor Green
    }
} catch {
    Write-Host "  ! Remote origin configuration skipped" -ForegroundColor Yellow
}

# Push to origin
try {
    $result = git remote get-url origin 2>$null
    if ($result) {
        Write-Host "Pushing to origin..." -ForegroundColor Yellow
        # Using 'main' instead of 'master' as detected by git branch
        git push origin main --force
        if ($LASTEXITCODE -eq 0) {
            $pushResults["origin"] = "SUCCESS"
            Write-Host "  SUCCESS Deployed to origin" -ForegroundColor Green
        } else {
             $pushResults["origin"] = "FAILED"
             Write-Host "  ! Push failed" -ForegroundColor Red
        }
    } else {
        $pushResults["origin"] = "NOT_CONFIGURED"
        Write-Host "  ! Remote origin not configured" -ForegroundColor Yellow
    }
} catch {
    $pushResults["origin"] = "FAILED"
    Write-Host "  ERROR Failed to deploy to origin" -ForegroundColor Red
}

# Report results
$successful = ($pushResults.Values | Where-Object { $_ -eq "SUCCESS" }).Count
Write-Host "`nSUCCESS NEXUS DEPLOYMENT COMPLETE" -ForegroundColor Cyan
Write-Host "  Deployed to $successful remote pillars" -ForegroundColor Green
