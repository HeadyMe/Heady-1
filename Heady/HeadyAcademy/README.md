# HeadyAcademy

## Local Setup Guide

### Prerequisites
- Python 3.10+
- Git (GitHub Desktop installed ✓)
- Docker Desktop (installed ✓)

### Clone & Run Locally

```powershell
# Clone the repository
git clone https://github.com/YourUsername/HeadySystems.git
cd HeadySystems/Heady/HeadyAcademy

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create environment file
Copy-Item Vault\.env.example Vault\.env
# Edit Vault\.env with your GITHUB_TOKEN and other secrets

# Check system status
.\Start_HeadyAcademy.ps1 -Mode status

# Run HeadyMaster
.\Start_HeadyAcademy.ps1 -Mode master
```

### Docker Deployment (Alternative)

```powershell
# Build and run with Docker Compose
docker build -t heady-academy .
docker run -d --name heady-master `
  -v ${PWD}/Playground:/app/Playground `
  -v ${PWD}/Vault:/app/Vault `
  --env-file Vault/.env `
  heady-academy

# Or use docker-compose if available
docker-compose up -d
```

### GitHub Desktop Workflow
1. Open GitHub Desktop → File → Clone Repository
2. Enter: `https://github.com/YourUsername/HeadySystems`
3. Choose local path and click Clone
4. Open in terminal and follow PowerShell commands above

**Multi-Agent Orchestration System** - A modular framework for automating development workflows through specialized AI agent nodes.

## Quick Start

```powershell
# 1. Check system status
.\Start_HeadyAcademy.ps1 -Mode status

# 2. Setup secrets (one-time)
cp .env.example Vault/.env
# Edit Vault/.env with your API keys

# 3. Install dependencies
pip install -r requirements.txt

# 4. Launch HeadyMaster
.\Start_HeadyAcademy.ps1
```

## Architecture

```
HeadyAcademy/
├── HeadyMaster.py          # Main orchestrator
├── Node_Registry.yaml      # Agent definitions
├── Start_HeadyAcademy.ps1  # Startup script
├── Students/Wrappers/      # Agent wrapper scripts
├── Tools/                  # Python tool implementations
├── Playground/             # Drop files here for processing
├── Logs/                   # Output logs and reports
├── Content_Forge/          # Generated content
└── Vault/                  # Secrets (.env file)
```

## Agent Nodes

| Node | Role | Triggers | Tool |
|------|------|----------|------|
| **BRIDGE** | Network Connector | mcp, connect, warp | MCP Server |
| **MUSE** | Brand Architect | whitepaper, marketing | Content Generator |
| **SENTINEL** | Guardian | grant_auth, verify_auth | HeadyChain |
| **NOVA** | Expander | scan_gaps | Gap Scanner |
| **OBSERVER** | Monitor | monitor | Natural Observer |
| **JANITOR** | Custodian | clean | Clean Sweep |
| **JULES** | Optimizer | optimization | Optimizer |
| **SOPHIA** | Matriarch | learn_tool | Tool Learner |
| **CIPHER** | Cryptolinguist | obfuscate | Heady Crypt |
| **ATLAS** | Archivist | documentation | Auto Doc |
| **MURPHY** | Inspector | security_audit | Security Audit |
| **SASHA** | Dreamer | brainstorming | Brainstorm |
| **SCOUT** | Hunter | scan_github | GitHub Scanner |
| **OCULUS** | Visualizer | visualize | Visualizer |
| **BUILDER** | Constructor | new_project | Hydrator |
| **FOREMAN** | Consolidator | consolidate, merge | Consolidator |

## Usage

### Interactive Mode (HeadyMaster)
Drop files into the `Playground/` directory. HeadyMaster will:
1. Analyze file content for trigger keywords
2. Route to appropriate agent nodes
3. Execute tools and generate reports

### Direct Wrapper Calls
```powershell
# Brainstorming
.\Students\Wrappers\Call_Sasha.ps1 -Topic "product roadmap"

# Security Audit
.\Students\Wrappers\Call_Murphy.ps1 -Target ".\src" -OpenReport

# Content Generation
.\Students\Wrappers\Call_Muse.ps1 -Mode whitepaper -Subject "AI Integration"

# GitHub Scanning
.\Students\Wrappers\Call_Scout.ps1 -Query "python automation"

# Project Visualization
.\Students\Wrappers\Call_Oculus.ps1 -Target "." -OpenReport
```

### MCP Server (AI Client Integration)
```powershell
# Start MCP Server for Claude, Cursor, or other AI clients
.\Start_HeadyAcademy.ps1 -Mode mcp
```

## Configuration

### Environment Variables (.env)
```bash
# Required for SCOUT
GITHUB_TOKEN=your_github_token

# Core authentication
HEADY_USER=admin
HEADY_ROLE=ADMIN

# Node toggles (set to 'false' to disable)
NODE_SCOUT_ENABLED=true
NODE_MURPHY_ENABLED=true
```

### Disabling Nodes
Set `NODE_<NAME>_ENABLED=false` in `Vault/.env`:
```bash
NODE_SCOUT_ENABLED=false    # Disables GitHub scanning
NODE_JANITOR_ENABLED=false  # Disables cleanup operations
```

## Startup Modes

| Mode | Description |
|------|-------------|
| `master` | Start HeadyMaster orchestrator (default) |
| `status` | Check system prerequisites and node availability |
| `test` | Run quick tests on sample nodes |
| `mcp` | Start MCP Server for AI client connections |

```powershell
.\Start_HeadyAcademy.ps1 -Mode status
.\Start_HeadyAcademy.ps1 -Mode test
.\Start_HeadyAcademy.ps1 -Mode mcp
.\Start_HeadyAcademy.ps1  # default: master
```

## Deployment (Render)

The `Students/Wrappers/render.yaml` blueprint configures:
- **heady-master** worker service
- **heady-academy-db** PostgreSQL database
- Environment variable groups for secrets

```bash
# Deploy via Render CLI or dashboard
render blueprint apply
```

## Requirements

- Python 3.10+
- PyYAML (`pip install pyyaml`)
- PowerShell 5.1+ (Windows) or pwsh (Linux/Mac)

## License

HeadySystems © 2024-2026

## Pre-Deployment Verification Checklist

### Functionality Checks
- [ ] `.\Start_HeadyAcademy.ps1 -Mode status` returns all green
- [ ] `Vault\.env` contains valid `GITHUB_TOKEN`
- [ ] `Playground/` directory exists and is writable
- [ ] `Node_Registry.yaml` parses without errors
- [ ] All wrapper scripts in `Students/Wrappers/` are executable

### Optimization Recommendations
- [ ] Enable only required nodes via `NODE_<NAME>_ENABLED=false`
- [ ] Set appropriate log levels in production
- [ ] Configure persistent disk size in `render.yaml` based on workload
- [ ] Review database connection pooling for high-traffic scenarios

### Quick Validation Commands
```powershell
# Validate YAML configurations
python -c "import yaml; yaml.safe_load(open('Node_Registry.yaml'))"

# Test node routing
.\Start_HeadyAcademy.ps1 -Mode test

# Verify environment
python -c "import os; print('GITHUB_TOKEN:', 'SET' if os.getenv('GITHUB_TOKEN') else 'MISSING')"
```

---
<div align="center">
  <p>Made with ❤️ by HeadySystems</p>
</div>
