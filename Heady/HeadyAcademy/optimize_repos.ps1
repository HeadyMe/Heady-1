# HEADY REPOSITORY OPTIMIZATION PROTOCOL
# Performs Singularity Squash and Garbage Collection

Write-Host "∞ INITIATING SINGULARITY SQUASH ∞" -ForegroundColor Cyan

# Stage all changes
Write-Host "Staging all changes..." -ForegroundColor Yellow
git add -A

# Create optimization commit
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Heady Optimization: Singularity Squash - $timestamp"

git commit -m $commitMessage -ErrorAction SilentlyContinue
Write-Host "  ✓ Optimization commit created" -ForegroundColor Green

# Aggressive garbage collection
Write-Host "Performing aggressive garbage collection..." -ForegroundColor Yellow
git gc --aggressive --prune=now
git repack -ad
git prune
Write-Host "  ✓ Repository optimized" -ForegroundColor Green

# Compress and clean
git reflog expire --expire=now --all
git gc --aggressive --prune=now
Write-Host "  ✓ Singularity Squash complete" -ForegroundColor Green

Write-Host "`n✓ REPOSITORY OPTIMIZATION COMPLETE" -ForegroundColor Cyan