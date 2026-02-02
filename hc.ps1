<#
.SYNOPSIS
    Heady CLI (hc) - Unified command interface for Heady Ecosystem
.DESCRIPTION
    Wraps common development and deployment scripts into a single command.
    Includes context-aware state management for deterministic system behavior.
.NOTES
    Heady CLI - Central command interface for the Heady Ecosystem
    Provides unified access to development, deployment, and context management tools
#>
.SYNOPSIS
    Heady CLI (hc) - Unified command interface for Heady Ecosystem
.DESCRIPTION
    Wraps common development and deployment scripts into a single command.
    Includes context-aware state management for deterministic system behavior.
.NOTES
    Heady CLI - Central command interface for the Heady Ecosystem
    Provides unified access to development, deployment, and context management tools
#>
.NOTES
    Heady CLI - Central command interface for the Heady Ecosystem
    Provides unified access to development, deployment, and context management tools
.SYNOPSIS
    Heady CLI (hc) - Unified command interface for Heady Ecosystem
.DESCRIPTION
    Wraps common development and deployment scripts into a single command.
    Includes context-aware state management for deterministic system behavior.
#>

# Manual argument parsing to support flags like -m or -a as commands
$Command = $args[0]
$RestArgs = @()
if ($args.Count -gt 1) {
    $RestArgs = $args[1..($args.Count-1)]
}

# Configuration
$ScriptsDir = Join-Path $PSScriptRoot "scripts"
$ContextFile = Join-Path $PSScriptRoot ".heady-context.json"
$SkillsMonitor = Join-Path $ScriptsDir "skills-monitor.js"

# Context State Functions
function Get-HeadyContext {
    if (Test-Path $ContextFile) {
        return Get-Content $ContextFile | ConvertFrom-Json
    }
    return $null
}

function Show-ContextStatus {
    $ctx = Get-HeadyContext
    if ($ctx) {
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "       HEADY CONTEXT STATUS               " -ForegroundColor Cyan
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Session: $($ctx.snapshot.sessionId)" -ForegroundColor Gray
        Write-Host "Version: $($ctx.version)" -ForegroundColor Gray
        Write-Host "Last Sync: $($ctx.savedAt)" -ForegroundColor Gray
        Write-Host ""
        
        if ($ctx.snapshot.services) {
            Write-Host "Services:" -ForegroundColor Yellow
            foreach ($svc in $ctx.snapshot.services) {
                $statusColor = switch ($svc.status) {
                    "online" { "Green" }
                    "degraded" { "Yellow" }
                    "offline" { "Red" }
                    default { "Gray" }
                }
                Write-Host "  • $($svc.name): $($svc.status)" -ForegroundColor $statusColor
            }
        }
        
        if ($ctx.snapshot.activeProject) {
            Write-Host ""
            Write-Host "Active Project: $($ctx.snapshot.activeProject)" -ForegroundColor Cyan
        }
        if ($ctx.snapshot.activeTask) {
            Write-Host "Active Task: $($ctx.snapshot.activeTask)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "No context state found. Run 'hc context init' to initialize." -ForegroundColor Yellow
    }
}

function Invoke-HeadyReady {
    Write-Host "🧭 Heady Ready: Preparing MCP services and context..." -ForegroundColor Cyan

    if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is required. Please install Node.js (v20+)."
        exit 1
    }

    if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
        Write-Error "pnpm is required. Please install it (npm i -g pnpm)."
        exit 1
    }

    $envLocal = Join-Path $PSScriptRoot ".env.local"
    $envExample = Join-Path $PSScriptRoot ".env.example"
    if (-not (Test-Path $envLocal) -and (Test-Path $envExample)) {
        Copy-Item $envExample $envLocal
        Write-Host "✅ Created .env.local from .env.example" -ForegroundColor Green
    } elseif (-not (Test-Path $envLocal)) {
        Write-Host "⚠️  .env.local not found. Create it to enable MCP services." -ForegroundColor Yellow
    }

    Write-Host "📦 Ensuring dependencies..." -ForegroundColor Yellow
    pnpm install --reporter=silent

    Write-Host "🔧 Building @heady/core-domain..." -ForegroundColor Yellow
    pnpm --filter @heady/core-domain build

    Initialize-HeadyContext

    Write-Host "🧪 Verifying MCP server readiness..." -ForegroundColor Yellow
    node "$ScriptsDir/verify-mcp-new.js"

    Write-Host "🔎 Verifying local services (non-docker)..." -ForegroundColor Yellow
    node "$ScriptsDir/verify-services.js" --no-docker

    Write-Host "✅ Heady MCP is ready. Use 'hc context mcp' to run the MCP server continuously." -ForegroundColor Green
}

function Initialize-HeadyContext {
    Write-Host "Initializing Heady Context..." -ForegroundColor Cyan
    
    # Build and start MCP server to initialize context
    Push-Location (Join-Path $PSScriptRoot "packages/core-domain")
    try {
        pnpm build 2>$null
        Write-Host "✅ Context system initialized" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Build failed, context may not be fully initialized" -ForegroundColor Yellow
    }
    Pop-Location
    
    # Create initial context if not exists
    if (-not (Test-Path $ContextFile)) {
        $initialContext = @{
            version = 0
            events = @()
            snapshot = @{
                sessionId = "session-$(Get-Date -Format 'yyyyMMddHHmmss')"
                startedAt = (Get-Date).ToUniversalTime().ToString("o")
                services = @()
                environment = @{}
                lastSync = (Get-Date).ToUniversalTime().ToString("o")
            }
            savedAt = (Get-Date).ToUniversalTime().ToString("o")
        }
        $initialContext | ConvertTo-Json -Depth 10 | Set-Content $ContextFile
        Write-Host "✅ Context file created at $ContextFile" -ForegroundColor Green
    }
}

function Show-Usage {
    Write-Host "Heady CLI (hc) - Optimal Node Connectivity Edition" -ForegroundColor Cyan
    Write-Host "Usage: hc [command] [options]"
    Write-Host "Default: hc (no args) runs readiness workflow"
    Write-Host ""
    Write-Host "Core Commands:" -ForegroundColor Yellow
    Write-Host "  ready, r      Prepare MCP services and context (default)"
    Write-Host "  merge, m        Run intelligent auto-merge (node scripts/auto-merge.js)"
    Write-Host "  deploy, d       Run full stack deployment (scripts/deploy_heady_full_stack.ps1)"
    Write-Host "  setup, s        Run infrastructure setup (scripts/setup-infrastructure.ps1)"
    Write-Host "  audit, au       Audit secrets (scripts/audit_secrets.ps1)"
    Write-Host "  test, t         Run tests"
    Write-Host "  desktop         Setup desktop shortcuts"
    Write-Host ""
    Write-Host "Arena Mode:" -ForegroundColor Yellow
    Write-Host "  arena create    Create a new arena match"
    Write-Host "  arena list      List active matches"
    Write-Host "  arena status    Get match status"
    Write-Host ""
    Write-Host "Node Orchestration:" -ForegroundColor Yellow
    Write-Host "  nodes           Show node status and connectivity"
    Write-Host "  nodes init      Initialize node orchestration system"
    Write-Host "  nodes optimize  Optimize node routing and load balancing"
    Write-Host "  nodes health    Run comprehensive node health checks"
    Write-Host ""
    Write-Host "Performance:" -ForegroundColor Yellow
    Write-Host "  perf            Show performance metrics"
    Write-Host "  perf monitor    Start real-time performance monitoring"
    Write-Host "  perf optimize   Apply performance optimizations"
    Write-Host ""
    Write-Host "Task Management:" -ForegroundColor Yellow
    Write-Host "  task submit     Submit task to optimized router"
    Write-Host "  task status     Get task execution status"
    Write-Host "  task list       List active and completed tasks"
    Write-Host ""
    Write-Host "Context Commands:" -ForegroundColor Yellow
    Write-Host "  context, ctx    Show current context status"
    Write-Host "  context init    Initialize context system"
    Write-Host "  context sync    Sync context state"
    Write-Host "  context mcp     Start MCP context server"
    Write-Host ""
    Write-Host "System Health:" -ForegroundColor Yellow
    Write-Host "  health          Launch interactive health dashboard"
    Write-Host "  health api      Start health API server only"
    Write-Host ""
}

if (-not $Command) {
    Invoke-HeadyReady
    exit 0
}

# Normalize command (remove leading dashes)
$CmdNormalized = $Command -replace "^-+", ""

switch -Regex ($CmdNormalized) {
    "^(ready|r)$" {
        Invoke-HeadyReady
    }
    "^(merge|m|auto-merge)$" { 
        Write-Host ">> Running Auto-Merge..." -ForegroundColor Cyan
        node "$ScriptsDir/auto-merge.js" @RestArgs
    }
    "^(deploy|d)$" {
        Write-Host ">> Running Deployment..." -ForegroundColor Cyan
        & "$ScriptsDir/deploy_heady_full_stack.ps1" @RestArgs
    }
    "^(setup|s)$" {
        Write-Host ">> Running Setup..." -ForegroundColor Cyan
        & "$ScriptsDir/setup-infrastructure.ps1" @RestArgs
    }
    "^(audit|au)$" {
        Write-Host ">> Running Audit..." -ForegroundColor Cyan
        & "$ScriptsDir/audit_secrets.ps1" @RestArgs
    }
    "^(ingest|i)$" {
        Write-Host ">> Running Data Ingestion..." -ForegroundColor Cyan
        node "$ScriptsDir/ingest-data.js" @RestArgs
    }
    "^(arena|a)$" {
        $SubCmd = $RestArgs[0]
        switch ($SubCmd) {
            "create" {
                Write-Host ">> Creating Arena Match..." -ForegroundColor Cyan
                $MatchName = if ($RestArgs.Count -gt 1) { $RestArgs[1] } else { "Arena Match" }
                node "$PSScriptRoot/packages/task-manager/dist/core/system-integrator.js" --arena-create "$MatchName"
            }
            "list" {
                Write-Host ">> Listing Arena Matches..." -ForegroundColor Cyan
                node "$PSScriptRoot/packages/task-manager/dist/core/system-integrator.js" --arena-list
            }
            "status" {
                $MatchId = $RestArgs[1]
                if (-not $MatchId) {
                    Write-Host "Usage: hc arena status <match-id>" -ForegroundColor Red
                    exit 1
                }
                Write-Host ">> Getting Match Status..." -ForegroundColor Cyan
                node "$PSScriptRoot/packages/task-manager/dist/core/system-integrator.js" --arena-status "$MatchId"
            }
            default {
                Write-Host "Usage: hc arena <create|list|status>" -ForegroundColor Yellow
            }
        }
    }
    "^(skills|skill|sk)$" {
        $SubCmd = $RestArgs[0]
        switch ($SubCmd) {
            "report" {
                Write-Host ">> Generating Skills Performance Report..." -ForegroundColor Cyan
                node $SkillsMonitor report
            }
            "status" {
                $skillId = $RestArgs[1]
                if (-not $skillId) {
                    Write-Host "Usage: hc skills status <skillId>" -ForegroundColor Red
                    exit 1
                }
                Write-Host ">> Getting Skill Status..." -ForegroundColor Cyan
                node $SkillsMonitor status $skillId
            }
            "list" {
                Write-Host ">> Listing All Skills..." -ForegroundColor Cyan
                node $SkillsMonitor list
            }
            default {
                Write-Host "Usage: hc skills [report|status|list]" -ForegroundColor Yellow
            }
        }
    }
    "^(perf|performance)$" {
        $SubCmd = $RestArgs[0]
        switch ($SubCmd) {
            "monitor" {
                Write-Host ">> Starting Performance Monitor..." -ForegroundColor Cyan
                node "$PSScriptRoot/packages/task-manager/dist/core/system-integrator.js" --monitor
            }
            "optimize" {
                Write-Host ">> Applying Performance Optimizations..." -ForegroundColor Cyan
                node "$PSScriptRoot/packages/task-manager/dist/core/system-integrator.js" --optimize-performance
            }
            default {
                Write-Host ">> Performance Metrics..." -ForegroundColor Cyan
                node "$PSScriptRoot/packages/task-manager/dist/core/system-integrator.js" --performance
            }
        }
    }
    "^(task|tasks)$" {
        $SubCmd = $RestArgs[0]
        switch ($SubCmd) {
            "submit" {
                $taskType = $RestArgs[1]
                $taskName = $RestArgs[2]
                if (-not $taskType -or -not $taskName) {
                    Write-Host "Usage: hc task submit <type> <name>" -ForegroundColor Red
                    exit 1
                }
                Write-Host ">> Submitting Task..." -ForegroundColor Cyan
                node "$PSScriptRoot/packages/task-manager/dist/core/optimized-task-router.js" --submit $taskType $taskName
            }
            "status" {
                $taskId = $RestArgs[1]
                if (-not $taskId) {
                    Write-Host "Usage: hc task status <task-id>" -ForegroundColor Red
                    exit 1
                }
                Write-Host ">> Task Status..." -ForegroundColor Cyan
                node "$PSScriptRoot/packages/task-manager/dist/core/optimized-task-router.js" --status $taskId
            }
            "list" {
                Write-Host ">> Listing Tasks..." -ForegroundColor Cyan
                node "$PSScriptRoot/packages/task-manager/dist/core/optimized-task-router.js" --list
            }
            default {
                Write-Host "Usage: hc task [submit|status|list]" -ForegroundColor Yellow
            }
        }
    }
    "^(test|t)$" {
        Write-Host ">> Running Tests..." -ForegroundColor Cyan
        npm test @RestArgs
    }
    "^desktop$" {
        Write-Host ">> Setting up Desktop Shortcuts..." -ForegroundColor Cyan
        node "$ScriptsDir/setup-desktop-icons.js" @RestArgs
    }
    "^(context|ctx)$" {
        $SubCmd = $RestArgs[0]
        switch ($SubCmd) {
            "init" {
                Initialize-HeadyContext
            }
            "sync" {
                Write-Host ">> Syncing Context..." -ForegroundColor Cyan
                $ctx = Get-HeadyContext
                if ($ctx) {
                    $ctx.snapshot.lastSync = (Get-Date).ToUniversalTime().ToString("o")
                    $ctx.savedAt = (Get-Date).ToUniversalTime().ToString("o")
                    $ctx | ConvertTo-Json -Depth 10 | Set-Content $ContextFile
                    Write-Host "✅ Context synced (version $($ctx.version))" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  No context found. Run 'hc context init' first." -ForegroundColor Yellow
                }
            }
            "mcp" {
                Write-Host ">> Starting MCP Context Server..." -ForegroundColor Cyan
                Push-Location (Join-Path $PSScriptRoot "packages/core-domain")
                pnpm start:mcp
                Pop-Location
            }
            "events" {
                $ctx = Get-HeadyContext
                if ($ctx -and $ctx.events) {
                    Write-Host "Recent Events:" -ForegroundColor Yellow
                    $ctx.events | Select-Object -Last 10 | ForEach-Object {
                        Write-Host "  [$($_.timestamp)] $($_.type) from $($_.source)" -ForegroundColor Gray
                    }
                }
            }
            default {
                Show-ContextStatus
            }
        }
    }
    "^(status|st)$" {
        Show-ContextStatus
    }
    "^health$" {
        $SubCmd = $RestArgs[0]
        $HealthServer = Join-Path $PSScriptRoot "tools/system-health/health-server.js"
        
        if ($SubCmd -eq "api") {
            Write-Host ">> Starting Health API Server..." -ForegroundColor Cyan
            node $HealthServer
        } else {
            Write-Host ">> Launching System Health Dashboard..." -ForegroundColor Cyan
            Start-Process node -ArgumentList $HealthServer -NoNewWindow
            Start-Sleep -Seconds 2
            Start-Process "http://localhost:3300/dashboard"
            Write-Host "✅ Dashboard launched at http://localhost:3300/dashboard" -ForegroundColor Green
            Write-Host "   Press Ctrl+C in the server window to stop" -ForegroundColor Gray
        }
    }
    default {
        Write-Host "!! Unknown command: $Command" -ForegroundColor Red
        Show-Usage
        exit 1
    }
}
