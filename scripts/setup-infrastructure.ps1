# Heady Infrastructure Setup Script
# Automates configuration of GitHub, Cloudflare, Render, and Drupal

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('development', 'staging', 'production')]
    [string]$Environment = 'development',
    
    [switch]$SkipGitHub,
    [switch]$SkipCloudflare,
    [switch]$SkipRender,
    [switch]$SkipDrupal
)

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║         HEADY INFRASTRUCTURE SETUP - $($Environment.ToUpper())
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Load environment variables
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $idx = $line.IndexOf('=')
            if ($idx -gt 0) {
                $key = $line.Substring(0, $idx).Trim()
                $value = $line.Substring($idx + 1)
                if ($key) {
                    [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
                }
            }
        }
    }
    Write-Host "✅ Loaded .env.local" -ForegroundColor Green
}

# GitHub Setup
if (-not $SkipGitHub) {
    Write-Host "`n[1/4] GitHub Configuration" -ForegroundColor Yellow
    
    # Check GitHub CLI
    try {
        $ghVersion = gh --version 2>$null
        Write-Host "  ✅ GitHub CLI: Installed" -ForegroundColor Green
        
        # Check authentication
        $authStatus = gh auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ GitHub: Authenticated" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  GitHub: Not authenticated. Run 'gh auth login'" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ GitHub CLI: Not installed" -ForegroundColor Red
        Write-Host "     Install from: https://cli.github.com/" -ForegroundColor Gray
    }
    
    # Verify repository
    if (Test-Path ".git") {
        $remote = git remote get-url origin 2>$null
        if ($remote) {
            Write-Host "  ✅ Git Remote: $remote" -ForegroundColor Green
        }
    }
}

# Cloudflare Setup
if (-not $SkipCloudflare) {
    Write-Host "`n[2/4] Cloudflare Configuration" -ForegroundColor Yellow
    
    # Check Wrangler CLI
    try {
        $wranglerVersion = npx wrangler --version 2>$null
        Write-Host "  ✅ Wrangler CLI: Available" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Wrangler CLI: Not found (will install on first use)" -ForegroundColor Yellow
    }
    
    # Check Cloudflare credentials
    if ($env:CLOUDFLARE_API_TOKEN) {
        Write-Host "  ✅ Cloudflare API Token: Set" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Cloudflare API Token: Not set" -ForegroundColor Yellow
    }
    
    # Check Cloudflared (Tunnel)
    try {
        $tunnelVersion = cloudflared --version 2>$null
        Write-Host "  ✅ Cloudflared: $tunnelVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Cloudflared: Not installed" -ForegroundColor Yellow
        Write-Host "     Install from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor Gray
    }
}

# Render Setup
if (-not $SkipRender) {
    Write-Host "`n[3/4] Render.com Configuration" -ForegroundColor Yellow
    
    if ($env:RENDER_API_KEY) {
        Write-Host "  ✅ Render API Key: Set" -ForegroundColor Green
        
        # Test Render API
        try {
            $headers = @{
                "Authorization" = "Bearer $env:RENDER_API_KEY"
            }
            $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers -Method Get -ErrorAction Stop
            Write-Host "  ✅ Render API: Connected" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Render API: Connection failed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  Render API Key: Not set" -ForegroundColor Yellow
    }
}

# Drupal Setup
if (-not $SkipDrupal) {
    Write-Host "`n[4/4] Drupal CMS Configuration" -ForegroundColor Yellow
    
    # Check if Drupal is running
    try {
        $drupalHealth = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "  ✅ Drupal: Running on port 8080" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Drupal: Not running" -ForegroundColor Yellow
        Write-Host "     Start with: docker-compose -f infra/drupal/docker-compose.drupal.yml up -d" -ForegroundColor Gray
    }
}

# Summary
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                   SETUP SUMMARY                               ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

Write-Host "Infrastructure Components:" -ForegroundColor Cyan
Write-Host "  • GitHub: Repository, Actions, Apps, Gists, Container Registry"
Write-Host "  • Cloudflare: Workers (Edge), Tunnel (Secure Access), KV (Cache)"
Write-Host "  • Render: Backend Services, PostgreSQL, Redis"
Write-Host "  • Drupal: CMS for HeadyConnection content"

Write-Host "`nDeployment Flow:" -ForegroundColor Cyan
Write-Host "  1. Push to GitHub → Triggers Actions"
Write-Host "  2. GitHub Actions → Builds & Tests"
Write-Host "  3. Deploy to Render → Backend services"
Write-Host "  4. Deploy to Cloudflare → Edge routing"
Write-Host "  5. Create Gist → Deployment summary"

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Configure GitHub secrets (RENDER_API_KEY, CLOUDFLARE_API_TOKEN)"
Write-Host "  2. Setup Cloudflare Workers: cd infra/cloudflare-workers && pnpm install"
Write-Host "  3. Deploy to Render: Push to main branch"
Write-Host "  4. Start Drupal: docker-compose -f infra/drupal/docker-compose.drupal.yml up -d"
Write-Host "  5. Verify: Run ./scripts/verify_full_stack.py"

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "  • Infrastructure Guide: docs/INFRASTRUCTURE.md"
Write-Host "  • MCP Integration: docs/MCP_INTEGRATION.md"
Write-Host "  • Deployment Summary: docs/DEPLOYMENT_SUMMARY.md"
