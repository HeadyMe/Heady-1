# HEADY SSH AUTHENTICATION PROTOCOL
# Configures SSH keys and authentication

$ErrorActionPreference = "Continue"

Write-Host "∞ SSH AUTHENTICATION PROTOCOL ∞" -ForegroundColor Cyan

$sshDir = "$env:USERPROFILE\.ssh"
$keyFile = "$sshDir\id_rsa"
$pubKeyFile = "$sshDir\id_rsa.pub"

# Ensure SSH directory exists
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "  + Created SSH directory" -ForegroundColor Green
}

# Check for existing keys
if (Test-Path $keyFile) {
    Write-Host "  ✓ SSH key already exists" -ForegroundColor Green
} else {
    Write-Host "  ! No SSH key found. Generating..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -C 'heady@systems.local' -f $keyFile -N ""
    if (Test-Path $keyFile) {
        Write-Host "  ✓ SSH key generated" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to generate SSH key" -ForegroundColor Red
    }
}

# Display Public Key for user
if (Test-Path $pubKeyFile) {
    $pubKey = Get-Content $pubKeyFile
    Write-Host "`nYOUR PUBLIC KEY (Add this to GitHub):" -ForegroundColor Cyan
    Write-Host $pubKey -ForegroundColor Gray
    Write-Host ""
}

# Configure Git to use SSH
try {
    git config --global user.name "HeadySystems"
    git config --global user.email "heady@systems.local"
    Write-Host "  ✓ Git identity configured" -ForegroundColor Green
    
    # Check if we are in a git repo and update remote
    if (Test-Path .git) {
        $remote = git remote get-url origin 2>$null
        if ($remote -like "https://github.com/*") {
            $newRemote = $remote -replace "https://github.com/", "git@github.com:"
            git remote set-url origin $newRemote
            Write-Host "  ✓ Updated remote origin to SSH: $newRemote" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  ! Git configuration failed" -ForegroundColor Red
}

# Test SSH connection
if (Test-Path $keyFile) {
    Write-Host "Testing SSH connection..." -ForegroundColor Yellow
    
    $sshOutput = ""
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "ssh"
        $psi.Arguments = "-T git@github.com"
        $psi.RedirectStandardError = $true
        $psi.RedirectStandardOutput = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        
        $proc = New-Object System.Diagnostics.Process
        $proc.StartInfo = $psi
        $proc.Start() | Out-Null
        $proc.WaitForExit()
        
        $out = $proc.StandardOutput.ReadToEnd()
        $err = $proc.StandardError.ReadToEnd()
        $sshOutput = "$out`n$err"
    } catch {
        $sshOutput = "Error executing ssh: $_"
    }
    
    if ($sshOutput -match "successfully authenticated") {
        Write-Host "  ✓ SSH authentication verified" -ForegroundColor Green
    } else {
        Write-Host "  ! SSH authentication failed or key not authorized by GitHub" -ForegroundColor Yellow
        Write-Host "    Ensure the public key above is added to your GitHub account." -ForegroundColor Gray
    }
}

Write-Host "`n✓ SSH PROTOCOL COMPLETE" -ForegroundColor Cyan
