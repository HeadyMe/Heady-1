# Heady Scripts Directory

## 📜 Available Scripts

### **Deployment & Infrastructure**

#### `deploy_heady_full_stack.ps1`
Complete deployment automation for the Heady ecosystem.

```powershell
.\scripts\deploy_heady_full_stack.ps1
```

**Actions:**
1. Checks prerequisites (Node, pnpm, Docker)
2. Generates/audits secrets
3. Installs dependencies
4. Builds project
5. Starts Docker containers
6. Verifies health endpoints

#### `setup-infrastructure.ps1`
Infrastructure setup and validation for GitHub, Cloudflare, Render, and Drupal.

```powershell
.\scripts\setup-infrastructure.ps1 -Environment production
```

**Flags:**
- `-Environment` - development, staging, or production
- `-SkipGitHub` - Skip GitHub checks
- `-SkipCloudflare` - Skip Cloudflare checks
- `-SkipRender` - Skip Render checks
- `-SkipDrupal` - Skip Drupal checks

#### `setup_ssh.ps1`
Configures SSH keys and authentication for GitHub.

```powershell
.\scripts\setup_ssh.ps1
```

**Actions:**
- Checks/Generates SSH keys
- Configures Git identity
- Verifies GitHub connection

#### `nexus_deploy.ps1`
Deploys the repository to the remote origin.

```powershell
.\scripts\nexus_deploy.ps1
```

**Actions:**
- Configures remote origin
- Pushes `main` branch
- Reports deployment status

### **Security & Secrets**

#### `generate_missing_secrets.py`
Generates cryptographically secure secrets for local development.

```bash
python scripts/generate_missing_secrets.py
```

Creates `.env.local` with:
- JWT secret keys
- API authentication tokens
- Database passwords
- Encryption keys

#### `audit_secrets.ps1`
Audits existing secrets in `.env.local`.

```powershell
.\scripts\audit_secrets.ps1
```

#### `rotate_secrets.py`
Rotates security keys in `.env.local` and creates a backup.

```bash
python scripts/rotate_secrets.py
```

**Actions:**
- Backs up current `.env.local`
- Rotates `JWT_SECRET_KEY`, `HEADY_AUTH_TOKEN`, `ENCRYPTION_KEY`, `WEBHOOK_SIGNATURE_SECRET`
- Preserves other variables

**Documentation:** `docs/ROTATE_SECRETS_GUIDE.md`

### **Testing & Verification**

#### `verify_full_stack.py`
Verifies all services are running and healthy.

```bash
python scripts/verify_full_stack.py
```

**Checks:**
- PostgreSQL (port 5432)
- Redis (port 6379)
- IDE Backend (port 4100)
- API health endpoints

#### `test-mcp-integration.js`
Tests MCP service integration end-to-end.

```bash
node scripts/test-mcp-integration.js
```

**Tests:**
- Health check
- MCP service listing
- Code generation task (Jules)
- Design system task (Heady MCP)
- Batch execution

### **Code Management**

#### `auto-merge.js` ⭐ Enhanced
Intelligent code merging with quality analysis.

```bash
# Basic merge
node scripts/auto-merge.js left.ts right.ts merged.ts

# With config file
node scripts/auto-merge.js --config auto-merge.config.json

# Triple output mode (generates 3 versions)
npm run merge:triple -- left.ts right.ts merged.ts

# Verbose mode
npm run merge:verbose -- left.ts right.ts merged.ts
```

**New Features (v2.0):**
- ✅ Config file support (`auto-merge.config.json`)
- ✅ Triple output mode (`--triple`)
- ✅ Environment variable configuration
- ✅ Automatic directory creation
- ✅ Directory-by-side merging

**See**: `docs/AUTO_MERGE_GUIDE.md` and `docs/AUTO_MERGE_ENHANCEMENTS.md`

#### `auto-merge.ps1`
PowerShell wrapper for auto-merge with dry-run support.

```powershell
.\scripts\auto-merge.ps1 -LeftPath left.ts -RightPath right.ts -OutputPath merged.ts -DryRun -Verbose
```

### **Development Tools**

#### `setup-desktop-icons.js`
Creates desktop shortcuts for easy IDE access.

```bash
npm run setup:desktop
```

**Creates:**
- `Launch Heady IDE.bat` - Starts dev server with `.env.local` loaded
- `Start Heady Docker.bat` - Launches full Docker stack

#### `example-mcp-tasks.sh`
Example curl commands for MCP task execution.

```bash
bash scripts/example-mcp-tasks.sh
```

**Examples:**
- Code generation with Jules
- Research with GitHub Copilot
- Design system with Heady MCP
- Browser automation with Playwright
- Batch task execution

## 🚀 Quick Reference

### **First-Time Setup**
```bash
# 1. Setup infrastructure
.\scripts\setup-infrastructure.ps1

# 2. Generate secrets
python scripts\generate_missing_secrets.py

# 3. Create desktop shortcuts
npm run setup:desktop

# 4. Verify everything
python scripts\verify_full_stack.py
```

### **Daily Development**
```bash
# Start IDE (via desktop shortcut or command)
pnpm dev --filter heady-automation-ide

# Or use desktop shortcut:
# Double-click "Launch Heady IDE.bat"
```

### **Deployment**
```bash
# Deploy to production (triggers GitHub Actions)
git push origin main

# Or manual deployment
.\scripts\deploy_heady_full_stack.ps1
```

### **Code Merging**
```bash
# Smart merge with review
npm run merge:triple -- old.ts new.ts merged.ts

# Review generated files:
# - merged.left.ts   (all from old.ts)
# - merged.right.ts  (all from new.ts)
# - merged.auto.ts   (intelligent merge)
```

### **Testing**
```bash
# Test MCP integration
node scripts/test-mcp-integration.js

# Verify services
python scripts/verify_full_stack.py

# Run unit tests
pnpm test
```

## 📋 Script Dependencies

### **Python Scripts**
- Python 3.x
- `requests` library (for HTTP checks)

### **PowerShell Scripts**
- PowerShell 5.1+ or PowerShell Core 7+
- Windows OS (for .bat shortcuts)

### **Node.js Scripts**
- Node.js 20+
- Dependencies installed via `pnpm install`

## 🔧 Environment Variables

Scripts respect these environment variables:

```bash
# Auto-merge configuration
AUTO_MERGE_CONFIG=path/to/config.json
AUTO_MERGE_LEFT=src/old
AUTO_MERGE_RIGHT=src/new
AUTO_MERGE_OUTPUT=src/merged
AUTO_MERGE_VERBOSE=true
AUTO_MERGE_TRIPLE=true

# Service ports
PORT=4100
POSTGRES_PORT=5432
REDIS_PORT=6379

# API keys (loaded from .env.local)
HC_AUTOMATION_API_KEY=...
GITHUB_TOKEN=...
```

## 📚 Documentation

Each script has detailed documentation:

- **Auto-Merge**: `docs/AUTO_MERGE_GUIDE.md`, `docs/AUTO_MERGE_ENHANCEMENTS.md`
- **Infrastructure**: `docs/INFRASTRUCTURE.md`
- **MCP Integration**: `docs/MCP_INTEGRATION.md`
- **Deployment**: `docs/DEPLOYMENT_SUMMARY.md`
- **Complete Stack**: `COMPLETE_STACK_GUIDE.md`

## 🎯 Best Practices

1. **Always run from project root** - Scripts use relative paths
2. **Check `.env.local` exists** - Many scripts require environment variables
3. **Use verbose mode** - When troubleshooting (`--verbose` or `-Verbose`)
4. **Review auto-merge output** - Don't blindly trust automated merges
5. **Test after deployment** - Run verification scripts

---

**Last Updated**: 2026-01-31
**Script Count**: 10+
**Status**: All scripts tested and production-ready

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>
