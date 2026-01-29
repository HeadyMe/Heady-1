# HEADY SECRET CENTRALIZATION PROTOCOL
$secretFile = "$PSScriptRoot\.env"
$gitignore  = "$PSScriptRoot\.gitignore"

Write-Host "INFINITY SECRET VAULT PROTOCOL ACTIVE INFINITY" -ForegroundColor Cyan

if (-not (Test-Path $secretFile)) {
    $template = @"
# HEADY MASTER KEY VAULT
# SECURITY LEVEL: HIGH
# [INFRASTRUCTURE]
DATABASE_URL=postgres://user:pass@localhost:5432/heady
RENDER_API_KEY=

# [IDENTITY]
GITHUB_PERSONAL_ACCESS_TOKEN=
SSH_PASSPHRASE=

# [INTELLIGENCE]
HF_TOKEN=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# [LOCAL APP]
HEADY_API_KEY=dev-key-123
SESSION_SECRET=local-secret
"@
    Set-Content -Path $secretFile -Value $template
    Write-Host "  SUCCESS Created Vault: $secretFile" -ForegroundColor Green
}

# Ensure Git Ignore
if (-not (Test-Path $gitignore)) { New-Item $gitignore -ItemType File -Value "" | Out-Null }
$gitContent = Get-Content $gitignore -Raw -ErrorAction SilentlyContinue
if ($gitContent -notmatch "\.env") {
    Add-Content -Path $gitignore -Value "`n.env"
    Add-Content -Path $gitignore -Value "secrets_dump.txt"
    Write-Host "  SUCCESS Git Security: .env ignored." -ForegroundColor Green
}

# Load Secrets into Session
if (Test-Path $secretFile) {
    $lines = Get-Content $secretFile
    foreach ($line in $lines) {
        if ($line -match '^\s*([A-Z_][A-Z0-9_]+)\s*=\s*(.*)') {
            [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2].Trim('"').Trim("'"), [System.EnvironmentVariableTarget]::Process)
        }
    }
    Write-Host "  SUCCESS Secrets loaded into memory." -ForegroundColor Green
}