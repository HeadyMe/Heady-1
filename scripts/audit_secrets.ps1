$ErrorActionPreference = "Stop"

function Write-Color($Text, $Color) {
    Write-Host $Text -ForegroundColor $Color
}

Write-Color "HEADY SECRET AUDIT" "Cyan"

$RequiredSecrets = @(
    "HEADY_AUTH_TOKEN",
    "POSTGRES_PASSWORD",
    "REDIS_PASSWORD",
    "JWT_SECRET_KEY"
)

if (Test-Path ".env.local") {
    $content = Get-Content ".env.local" -Raw
    foreach ($secret in $RequiredSecrets) {
        if ($content -match "(?m)^$secret=") {
            Write-Color "[OK] $secret" "Green"
        } else {
            Write-Color "[MISSING] $secret" "Red"
        }
    }
} else {
    Write-Color "No .env.local found" "Red"
}
