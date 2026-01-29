# HEADY NEXUS DEPLOYMENT PROTOCOL
# Distributes to 5 remote repositories

$remotes = @("origin", "heady-me", "heady-sys", "sandbox", "connection")
$pushResults = @{}

Write-Host "∞ INITIATING NEXUS DEPLOYMENT ∞" -ForegroundColor Cyan

# Configure remotes if not present
$remoteUrls = @{
    "origin" = "https://github.com/HeadyMe/HeadySystems.git"
    "heady-me" = "https://github.com/HeadyMe/Heady.git"
    "heady-sys" = "https://github.com/HeadySystems/Heady.git"
    "sandbox" = "https://github.com/HeadySystems/sandbox.git"
    "connection" = "https://github.com/HeadySystems/HeadyConnection.git"
}

foreach ($remote in $remotes) {
    try {
        $existing = git remote get-url $remote 2>$null
        if (-not $existing -and $remoteUrls[$remote]) {
            git remote add $remote $remoteUrls[$remote]
            Write-Host "  + Added remote: $remote" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ! Remote $remote configuration skipped" -ForegroundColor Yellow
    }
}

# Force push to all remotes
foreach ($remote in $remotes) {
    try {
        $result = git remote get-url $remote 2>$null
        if ($result) {
            Write-Host "Pushing to $remote..." -ForegroundColor Yellow
            git push $remote main --force 2>$null
            $pushResults[$remote] = "SUCCESS"
            Write-Host "  ✓ Deployed to $remote" -ForegroundColor Green
        } else {
            $pushResults[$remote] = "NOT_CONFIGURED"
            Write-Host "  ! Remote $remote not configured" -ForegroundColor Yellow
        }
    } catch {
        $pushResults[$remote] = "FAILED"
        Write-Host "  ✗ Failed to deploy to $remote" -ForegroundColor Red
    }
}

# Report results
$successful = ($pushResults.Values | Where-Object { $_ -eq "SUCCESS" }).Count
Write-Host "`n✓ NEXUS DEPLOYMENT COMPLETE" -ForegroundColor Cyan
Write-Host "  Deployed to $successful/$($remotes.Count) remote pillars" -ForegroundColor Green