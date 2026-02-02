param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("master", "test", "status", "mcp")]
    [string]$Mode = "master",

    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ACADEMY_ROOT = $PSScriptRoot
$WRAPPER_DIR = "$ACADEMY_ROOT\Students\Wrappers"

function Show-Help {
    Write-Host @"
HeadyAcademy Startup Script

USAGE:
    Start_HeadyAcademy.ps1 [-Mode <mode>] [-Verbose]

MODES:
    master   - Start HeadyMaster orchestrator (default)
    test     - Run quick test of all nodes
    status   - Check status of all components
    mcp      - Start MCP Server for AI client connections

EXAMPLES:
    Start_HeadyAcademy.ps1                    # Start HeadyMaster
    Start_HeadyAcademy.ps1 -Mode test         # Test all nodes
    Start_HeadyAcademy.ps1 -Mode status       # Check system status
    Start_HeadyAcademy.ps1 -Mode mcp          # Start MCP Server

SETUP:
    1. Copy .env.example to Vault/.env
    2. Fill in API keys (GITHUB_TOKEN, etc.)
    3. Run: Start_HeadyAcademy.ps1 -Mode status
    4. Run: Start_HeadyAcademy.ps1

NODES:
    BRIDGE   - Network/MCP connections
    MUSE     - Content generation
    SENTINEL - Blockchain auth
    NOVA     - Gap analysis
    OBSERVER - File monitoring
    JANITOR  - Cleanup
    JULES    - Code optimization
    SOPHIA   - Tool learning
    CIPHER   - Encryption
    ATLAS    - Documentation
    MURPHY   - Security audits
    SASHA    - Brainstorming
    SCOUT    - GitHub scanning
    OCULUS   - Visualization
    BUILDER  - Project scaffolding
"@
}

function Test-Prerequisites {
    Write-Host "`n[PREFLIGHT] Checking prerequisites..." -ForegroundColor Cyan
    
    $issues = @()
    
    # Python
    try {
        $pyVersion = python --version 2>&1
        Write-Host "  [OK] Python: $pyVersion" -ForegroundColor Green
    } catch {
        $issues += "Python not found"
        Write-Host "  [FAIL] Python not found" -ForegroundColor Red
    }
    
    # PyYAML
    try {
        $yamlCheck = python -c "import yaml; print('OK')" 2>&1
        if ($yamlCheck -eq "OK") {
            Write-Host "  [OK] PyYAML installed" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] PyYAML not installed" -ForegroundColor Yellow
            Write-Host "         Attempting auto-install..." -ForegroundColor Gray
            $null = pip install pyyaml 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] PyYAML installed successfully" -ForegroundColor Green
            } else {
                $issues += "PyYAML installation failed"
                Write-Host "  [FAIL] PyYAML installation failed - run manually: pip install pyyaml" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "  [WARN] Could not check PyYAML - run: pip install pyyaml" -ForegroundColor Yellow
    }
    
    # Vault/.env
    $envFile = "$ACADEMY_ROOT\Vault\.env"
    if (Test-Path $envFile) {
        Write-Host "  [OK] Vault/.env exists" -ForegroundColor Green
    } else {
        $issues += "Vault/.env missing"
        Write-Host "  [WARN] Vault/.env missing - copy from .env.example" -ForegroundColor Yellow
    }
    
    # Node_Registry.yaml
    $registryFile = "$ACADEMY_ROOT\Node_Registry.yaml"
    if (Test-Path $registryFile) {
        Write-Host "  [OK] Node_Registry.yaml exists" -ForegroundColor Green
    } else {
        $issues += "Node_Registry.yaml missing"
        Write-Host "  [FAIL] Node_Registry.yaml missing" -ForegroundColor Red
    }
    
    # HeadyMaster.py
    $masterFile = "$ACADEMY_ROOT\HeadyMaster.py"
    if (Test-Path $masterFile) {
        Write-Host "  [OK] HeadyMaster.py exists" -ForegroundColor Green
    } else {
        $issues += "HeadyMaster.py missing"
        Write-Host "  [FAIL] HeadyMaster.py missing" -ForegroundColor Red
    }
    
    return $issues.Count -eq 0
}

function Get-NodeStatus {
    Write-Host "`n[STATUS] Checking node availability..." -ForegroundColor Cyan
    
    $nodes = @(
        @{Name="BRIDGE"; Tool="Tools\MCP\Server.py"},
        @{Name="MUSE"; Tool="Tools\Content_Generator.py"},
        @{Name="SENTINEL"; Tool="Tools\Heady_Chain.py"},
        @{Name="NOVA"; Tool="Tools\Gap_Scanner.py"},
        @{Name="OBSERVER"; Tool="Tools\Daemons\Natural_Observer.py"},
        @{Name="JANITOR"; Tool="Tools\Clean_Sweep.py"},
        @{Name="JULES"; Tool="Tools\Optimizer.py"},
        @{Name="SOPHIA"; Tool="Tools\Tool_Learner.py"},
        @{Name="CIPHER"; Tool="Tools\Heady_Crypt.py"},
        @{Name="ATLAS"; Tool="Tools\Auto_Doc.py"},
        @{Name="MURPHY"; Tool="Tools\Security_Audit.py"},
        @{Name="SASHA"; Tool="Tools\Brainstorm.py"},
        @{Name="SCOUT"; Tool="Tools\Github_Scanner.py"},
        @{Name="OCULUS"; Tool="Tools\Visualizer.py"},
        @{Name="BUILDER"; Tool="Tools\Hydrator.py"},
        @{Name="FOREMAN"; Tool="Tools\Consolidator.py"},
        @{Name="NEXUS"; Tool="..\..\scripts\nexus_deploy.ps1"},
        @{Name="ORACLE"; Tool="Tools\Auto_Doc.py"}
    )
    
    $ready = 0
    $missing = 0
    
    foreach ($node in $nodes) {
        $wrapperPath = "$WRAPPER_DIR\Call_$($node.Name.Substring(0,1).ToUpper() + $node.Name.Substring(1).ToLower()).ps1"
        $toolPath = "$ACADEMY_ROOT\$($node.Tool)"
        
        $wrapperOK = Test-Path $wrapperPath
        $toolOK = Test-Path $toolPath
        
        if ($wrapperOK -and $toolOK) {
            Write-Host "  [READY] $($node.Name)" -ForegroundColor Green
            $ready++
        } elseif ($wrapperOK) {
            Write-Host "  [PARTIAL] $($node.Name) - missing tool" -ForegroundColor Yellow
            $missing++
        } elseif ($toolOK) {
            Write-Host "  [PARTIAL] $($node.Name) - missing wrapper" -ForegroundColor Yellow
            $missing++
        } else {
            Write-Host "  [MISSING] $($node.Name)" -ForegroundColor Red
            $missing++
        }
    }
    
    Write-Host "`n  Summary: $ready ready, $missing issues" -ForegroundColor Cyan
    return $ready
}

function Test-AllNodes {
    Write-Host "`n[TEST] Running quick node tests..." -ForegroundColor Cyan
    
    $tests = @(
        @{Name="SOPHIA"; Args="-Tool python"},
        @{Name="MUSE"; Args="-Mode marketing -Subject Test"},
        @{Name="SASHA"; Args="-Topic test"}
    )
    
    foreach ($test in $tests) {
        Write-Host "`n  Testing $($test.Name)..." -ForegroundColor Yellow
        $wrapperPath = "$WRAPPER_DIR\Call_$($test.Name.Substring(0,1).ToUpper() + $test.Name.Substring(1).ToLower()).ps1"
        
        if (Test-Path $wrapperPath) {
            try {
                $null = powershell -ExecutionPolicy Bypass -File $wrapperPath $test.Args.Split(" ") 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  [PASS] $($test.Name)" -ForegroundColor Green
                } else {
                    Write-Host "  [FAIL] $($test.Name)" -ForegroundColor Red
                }
            } catch {
                Write-Host "  [ERROR] $($test.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "  [SKIP] $($test.Name) - wrapper not found" -ForegroundColor Yellow
        }
    }
}

function Start-HeadyMaster {
    Write-Host "`n[LAUNCH] Starting HeadyMaster..." -ForegroundColor Cyan
    Write-Host "  Playground: $ACADEMY_ROOT\Playground" -ForegroundColor Gray
    Write-Host "  Drop files into Playground to trigger processing" -ForegroundColor Gray
    Write-Host "  Press Ctrl+C to stop`n" -ForegroundColor Gray
    
    python "$ACADEMY_ROOT\HeadyMaster.py"
}

function Start-MCPServer {
    Write-Host "`n[MCP] Starting MCP Server..." -ForegroundColor Cyan
    Write-Host "  Server: HeadyAcademy MCP Server" -ForegroundColor Gray
    Write-Host "  Protocol: JSON-RPC 2.0 over stdio" -ForegroundColor Gray
    Write-Host "  Press Ctrl+C to stop`n" -ForegroundColor Gray
    
    python "$ACADEMY_ROOT\Tools\MCP\Server.py"
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Host @"

  _   _                _            _                _                       
 | | | | ___  __ _  __| |_   _     / \   ___ __ _  __| | ___ _ __ ___  _   _ 
 | |_| |/ _ \/ _` |/ _` | | | |   / _ \ / __/ _` |/ _` |/ _ \ '_ ` _ \| | | |
 |  _  |  __/ (_| | (_| | |_| |  / ___ \ (_| (_| | (_| |  __/ | | | | | |_| |
 |_| |_|\___|\__,_|\__,_|\__, | /_/   \_\___\__,_|\__,_|\___|_| |_| |_|\__, |
                         |___/                                         |___/ 
                                                             
"@ -ForegroundColor Cyan

switch ($Mode.ToLower()) {
    "status" {
        $prereqOK = Test-Prerequisites
        $nodeCount = Get-NodeStatus
        
        if ($prereqOK -and $nodeCount -ge 10) {
            Write-Host "`n[READY] System is ready to launch!" -ForegroundColor Green
            Write-Host "  Run: Start_HeadyAcademy.ps1" -ForegroundColor Gray
        } else {
            Write-Host "`n[ATTENTION] Some issues need attention" -ForegroundColor Yellow
        }
    }
    
    "test" {
        Test-Prerequisites | Out-Null
        Test-AllNodes
    }
    
    "mcp" {
        if (Test-Prerequisites) {
            Start-MCPServer
        }
    }
    
    "master" {
        if (Test-Prerequisites) {
            Start-HeadyMaster
        } else {
            Write-Host "`n[ERROR] Prerequisites not met. Run with -Mode status first." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "`n[DONE] HeadyAcademy session ended" -ForegroundColor Cyan
exit 0
# Auto-scan and repair helper
function Invoke-HeadyAutoFix {
    param(
        [switch]$Silent
    )

    if (-not $Silent) {
        Write-Host "`n[AUTOFIX] Running automated project scan & repair..." -ForegroundColor Cyan
    }

    # 1) Check prerequisites
    $prereqOK = Test-Prerequisites
    if (-not $prereqOK) {
        if (-not $Silent) {
            Write-Host "  [STOP] Prerequisites failed. Resolve above issues and retry." -ForegroundColor Red
        }
        return $false
    }

    # 2) Check node status
    $readyCount = Get-NodeStatus
    if ($readyCount -lt 1) {
        if (-not $Silent) {
            Write-Host "  [WARN] No nodes ready. Skipping node-level fixes." -ForegroundColor Yellow
        }
    }

    # 3) Run quick sanity tests on core nodes
    if (-not $Silent) {
        Write-Host "`n[AUTOFIX] Running core node tests..." -ForegroundColor Cyan
    }
    Test-AllNodes

    # 4) Optionally run Nova gap scan with basic fixes if available
    $novaWrapper = Join-Path $WRAPPER_DIR "Call_Nova.ps1"
    if (Test-Path $novaWrapper) {
        if (-not $Silent) {
            Write-Host "`n[AUTOFIX] Invoking NOVA gap scan with auto-fix..." -ForegroundColor Cyan
        }
        try {
            $null = powershell -ExecutionPolicy Bypass -File $novaWrapper -ScanType all -Fix -Detailed 2>&1
            if ($LASTEXITCODE -ne 0 -and -not $Silent) {
                Write-Host "  [WARN] NOVA reported issues. Review output above." -ForegroundColor Yellow
            }
        } catch {
            if (-not $Silent) {
                Write-Host "  [WARN] Failed to run NOVA auto-fix: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    } elseif (-not $Silent) {
        Write-Host "`n[AUTOFIX] NOVA wrapper not found; skipping gap scan." -ForegroundColor DarkYellow
    }

    if (-not $Silent) {
        Write-Host "`n[AUTOFIX] Automated scan & repair sequence complete." -ForegroundColor Green
        Write-Host "  Next: review console output for remaining manual fixes." -ForegroundColor Gray
    }

    return $true
}
function Invoke-AutoFix {
    param(
        [switch]$Silent
    )

    if (-not (Test-Prerequisites)) {
        if (-not $Silent) {
            Write-Host "`n[AUTOFIX] Prerequisites not met. Aborting auto-fix." -ForegroundColor Red
            Write-Host "         Run with -Mode status to see detailed issues." -ForegroundColor Yellow
        }
        return $false
    }

    if (-not $Silent) {
        Write-Host "`n[AUTOFIX] Starting automated scan & repair sequence..." -ForegroundColor Cyan
    }

    $readyCount = Get-NodeStatus
    if ($readyCount -lt 1) {
        if (-not $Silent) {
            Write-Host "  [WARN] No nodes ready. Skipping node-level fixes." -ForegroundColor Yellow
        }
    }

    if (-not $Silent) {
        Write-Host "`n[AUTOFIX] Running core node tests..." -ForegroundColor Cyan
    }
    Test-AllNodes

    $novaWrapper = Join-Path $WRAPPER_DIR "Call_Nova.ps1"
    if (Test-Path $novaWrapper) {
        if (-not $Silent) {
            Write-Host "`n[AUTOFIX] Invoking NOVA gap scan with auto-fix..." -ForegroundColor Cyan
        }
        try {
            $null = powershell -ExecutionPolicy Bypass -File $novaWrapper -ScanType all -Fix -Detailed 2>&1
            if ($LASTEXITCODE -ne 0 -and -not $Silent) {
                Write-Host "  [WARN] NOVA reported issues. Review output above." -ForegroundColor Yellow
            }
        } catch {
            if (-not $Silent) {
                Write-Host "  [WARN] Failed to run NOVA auto-fix: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    } elseif (-not $Silent) {
        Write-Host "`n[AUTOFIX] NOVA wrapper not found; skipping gap scan." -ForegroundColor DarkYellow
    }

    if (-not $Silent) {
        Write-Host "`n[AUTOFIX] Automated scan & repair sequence complete." -ForegroundColor Green
        Write-Host "  Next: review console output for remaining manual fixes." -ForegroundColor Gray
    }

    return $true
}
# Entry point for direct auto-fix invocation
if ($MyInvocation.PSCommandPath -and
    [IO.Path]::GetFileName($MyInvocation.PSCommandPath) -ieq "Start_HeadyAcademy.ps1" -and
    $PSBoundParameters.ContainsKey("AutoFix")) {

    $silent = $false
    if ($PSBoundParameters.ContainsKey("Silent")) {
        $silent = [bool]$PSBoundParameters["Silent"]
    }

    Invoke-AutoFix -Silent:$silent | Out-Null
}
# Auto-fix flag passthrough when running with modes
if ($PSBoundParameters.ContainsKey("AutoFix") -and -not $PSBoundParameters.ContainsKey("Mode")) {
    $silent = $false
    if ($PSBoundParameters.ContainsKey("Silent")) {
        $silent = [bool]$PSBoundParameters["Silent"]
    }

    $result = Invoke-AutoFix -Silent:$silent
    if (-not $result) {
        Write-Host "`n[AUTOFIX] Completed with issues. Review output above." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "`n[AUTOFIX] Completed successfully." -ForegroundColor Green
    exit 0
}
# Comprehensive project scan and fix
if ($PSBoundParameters.ContainsKey("Scan") -or $PSBoundParameters.ContainsKey("Fix")) {
    $scanType = "all"
    if ($PSBoundParameters.ContainsKey("ScanType")) {
        $scanType = $PSBoundParameters["ScanType"]
    }
    
    $fixMode = $PSBoundParameters.ContainsKey("Fix")
    
    if (-not $Silent) {
        Write-Host "`n[SCAN] Starting comprehensive project scan..." -ForegroundColor Cyan
        Write-Host "  Type: $scanType" -ForegroundColor Gray
        Write-Host "  Auto-fix: $fixMode" -ForegroundColor Gray
    }
    
    # Run Nova gap scanner
    $novaWrapper = Join-Path $WRAPPER_DIR "Call_Nova.ps1"
    if (Test-Path $novaWrapper) {
        try {
            $novaArgs = @("-ScanType", $scanType)
            if ($fixMode) { $novaArgs += "-Fix" }
            
            $null = powershell -ExecutionPolicy Bypass -File $novaWrapper $novaArgs 2>&1
            if ($LASTEXITCODE -ne 0 -and -not $Silent) {
                Write-Host "  [WARN] Nova scan reported issues" -ForegroundColor Yellow
            }
        } catch {
            if (-not $Silent) {
                Write-Host "  [ERROR] Nova scan failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    # Validate core functionality
    if (-not $Silent) {
        Write-Host "`n[VALIDATE] Checking core functionality..." -ForegroundColor Cyan
    }
    
    $coreChecks = @(
        @{Path = "$ACADEMY_ROOT\HeadyMaster.py"; Name = "HeadyMaster"},
        @{Path = "$ACADEMY_ROOT\Tools\MCP\Server.py"; Name = "MCP Server"},
        @{Path = "$ACADEMY_ROOT\Tools\Gap_Scanner.py"; Name = "Gap Scanner"}
    )
    
    foreach ($check in $coreChecks) {
        if (Test-Path $check.Path) {
            if (-not $Silent) {
                Write-Host "  [OK] $($check.Name)" -ForegroundColor Green
            }
        } elseif (-not $Silent) {
            Write-Host "  [MISSING] $($check.Name)" -ForegroundColor Red
        }
    }
    
    if (-not $Silent) {
        Write-Host "`n[DONE] Project scan completed" -ForegroundColor Green
    }
}

# Handle auto-fix mode
if ($PSBoundParameters.ContainsKey("AutoFix")) {
    $silent = $false
    if ($PSBoundParameters.ContainsKey("Silent")) {
        $silent = [bool]$PSBoundParameters["Silent"]
    }

    $result = Invoke-AutoFix -Silent:$silent
    if (-not $result) {
        Write-Host "`n[AUTOFIX] Completed with issues. Review output above." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "`n[AUTOFIX] Completed successfully." -ForegroundColor Green
    exit 0
}

# Handle scan/fix operations
if ($PSBoundParameters.ContainsKey("Scan") -or $PSBoundParameters.ContainsKey("Fix")) {
    $scanType = "all"
    if ($PSBoundParameters.ContainsKey("ScanType")) {
        $scanType = $PSBoundParameters["ScanType"]
    }
    
    $fixMode = $PSBoundParameters.ContainsKey("Fix")
    
    if (-not $Silent) {
        Write-Host "`n[SCAN] Starting comprehensive project scan..." -ForegroundColor Cyan
        Write-Host "  Type: $scanType" -ForegroundColor Gray
        Write-Host "  Auto-fix: $fixMode" -ForegroundColor Gray
    }
    
    # Run Nova gap scanner
    $novaWrapper = Join-Path $WRAPPER_DIR "Call_Nova.ps1"
    if (Test-Path $novaWrapper) {
        try {
            $novaArgs = @("-ScanType", $scanType)
            if ($fixMode) { $novaArgs += "-Fix" }
            
            $null = powershell -ExecutionPolicy Bypass -File $novaWrapper $novaArgs 2>&1
            if ($LASTEXITCODE -ne 0 -and -not $Silent) {
                Write-Host "  [WARN] Nova scan reported issues" -ForegroundColor Yellow
            }
        } catch {
            if (-not $Silent) {
                Write-Host "  [ERROR] Nova scan failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    # Validate core functionality
    if (-not $Silent) {
        Write-Host "`n[VALIDATE] Checking core functionality..." -ForegroundColor Cyan
    }
    
    $coreChecks = @(
        @{Path = "$ACADEMY_ROOT\HeadyMaster.py"; Name = "HeadyMaster"},
        @{Path = "$ACADEMY_ROOT\Tools\MCP\Server.py"; Name = "MCP Server"},
        @{Path = "$ACADEMY_ROOT\Tools\Gap_Scanner.py"; Name = "Gap Scanner"}
    )
    
    foreach ($check in $coreChecks) {
        if (Test-Path $check.Path) {
            if (-not $Silent) {
                Write-Host "  [OK] $($check.Name)" -ForegroundColor Green
            }
        } elseif (-not $Silent) {
            Write-Host "  [MISSING] $($check.Name)" -ForegroundColor Red
        }
    }
    
    if (-not $Silent) {
        Write-Host "`n[DONE] Project scan completed" -ForegroundColor Green
    }
    exit 0
}

# Main execution block
if ($Help) {
    Show-Help
    exit 0
}

# Handle different execution modes
switch ($Mode.ToLower()) {
    "status" {
        $prereqOK = Test-Prerequisites
        $nodeCount = Get-NodeStatus
        
        if ($prereqOK -and $nodeCount -ge 10) {
            Write-Host "`n[READY] System is ready to launch!" -ForegroundColor Green
            Write-Host "  Run: Start_HeadyAcademy.ps1" -ForegroundColor Gray
        } else {
            Write-Host "`n[ATTENTION] Some issues need attention" -ForegroundColor Yellow
        }
    }
    
    "test" {
        Test-Prerequisites | Out-Null
        Test-AllNodes
    }
    
    "mcp" {
        if (Test-Prerequisites) {
            Start-MCPServer
        }
    }
    
    "master" {
        if (Test-Prerequisites) {
            Start-HeadyMaster
        } else {
            Write-Host "`n[ERROR] Prerequisites not met. Run with -Mode status first." -ForegroundColor Red
            exit 1
        }
    }
    
    default {
        Write-Host "`n[ERROR] Unknown mode: $Mode" -ForegroundColor Red
        Write-Host "Valid modes: status, test, mcp, master" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n[DONE] HeadyAcademy session ended" -ForegroundColor Cyan
exit 0
