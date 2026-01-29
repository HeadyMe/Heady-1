# HEADY SSH AUTHENTICATION PROTOCOL
# Configures SSH keys and authentication

Write-Host "∞ SSH AUTHENTICATION PROTOCOL ∞" -ForegroundColor Cyan

$sshDir = "$env:USERPROFILE\.ssh"
$keyFile = "$sshDir\id_rsa"
$pubFile = "$sshDir\id_rsa.pub"

# Ensure SSH directory exists
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "  + Created SSH directory" -ForegroundColor Green
}

# Check for existing keys
if (Test-Path $keyFile) {
    Write-Host "  ✓ SSH key already exists" -ForegroundColor Green
} else {
    Write-Host "  ! No SSH key found. Generate with:" -ForegroundColor Yellow
    Write-Host "    ssh-keygen -t rsa -b 4096 -C 'heady@systems.local'" -ForegroundColor Cyan
}

# Configure Git to use SSH
try {
    git config --global user.name "HeadySystems"
    git config --global user.email "heady@systems.local"
    Write-Host "  ✓ Git identity configured" -ForegroundColor Green
} catch {
    Write-Host "  ! Git configuration failed" -ForegroundColor Red
}

# Test SSH connection
if (Test-Path $keyFile) {
    Write-Host "Testing SSH connection..." -ForegroundColor Yellow
    $sshTest = ssh -T git@github.com 2>&1
    if ($sshTest -match "successfully authenticated") {
        Write-Host "  ✓ SSH authentication verified" -ForegroundColor Green
    } else {
        Write-Host "  ! SSH authentication needs setup" -ForegroundColor Yellow
    }
}

Write-Host "`n✓ SSH PROTOCOL COMPLETE" -ForegroundColor Cyan