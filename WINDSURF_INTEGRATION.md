# 🚀 Windsurf Integration Guide for Heady Automation IDE

## Project Overview
The Heady Automation IDE is a comprehensive DevOps automation system with:
- **Windsurf-style IDE integration** with Monaco editor
- **Browser automation** (headless/interactive) via Playwright
- **MCP (Model Context Protocol)** service integrations
- **Multi-mode execution** (IDE, Browser, Docker)
- **Secure API access** with authentication

## Quick Start

### 1. Clone & Setup
```bash
# Clone from HeadySystems monorepo
cd C:\Users\erich\CascadeProjects\HeadySystems

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Create desktop shortcuts
npm run setup:desktop
```

### 2. Launch Methods

#### Option A: Desktop Shortcuts (Recommended)
- **Launch Heady IDE.bat** - Starts dev server
- **Start Heady Docker.bat** - Docker environment

#### Option B: Command Line
```bash
# Development mode
cd apps/heady-automation-ide
pnpm dev

# Docker mode
docker-compose up -d
```

#### Option C: Full Deploy Script
```powershell
./scripts/deploy_heady_full_stack.ps1
```

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Browser Automation (Screenshot)
```bash
curl -X POST http://localhost:3000/api/task/screenshot \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_HC_AUTOMATION_API_KEY" \
  -d '{"url": "https://example.com", "interactive": false}'
```

## MCP Service Integration

### Available Services (.mcp/config.json)
1. **Heady MCP** - Core automation with Phi tokens
2. **GitHub Copilot** - AI coding assistance  
3. **Jules (Anthropic)** - Advanced AI tasks
4. **HuggingFace** - ML model integration
5. **Playwright** - Browser automation
6. **GitHub Gists** - Code snippets

### Configuration
Edit `.env.local`:
```env
# MCP Services
HEADY_MCP_ENDPOINT=http://localhost:3001
ANTHROPIC_API_KEY=sk-ant-...
JULES_API_KEY=...
HUGGINGFACE_TOKEN=hf_...
GITHUB_TOKEN=ghp_...
GITHUB_COPILOT_TOKEN=...
```

## Security Features

### API Key Authentication
All automation endpoints require `x-api-key` header:
```env
HC_AUTOMATION_API_KEY=your_secure_key
```

### CORS Protection
Local-only by default. Enable external:
```env
HC_ALLOW_NONLOCAL_ORIGINS=true
```

## Architecture

### Tech Stack
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, Vite, Monaco Editor
- **Database**: PostgreSQL
- **Cache**: Redis  
- **Browser**: Playwright (Chromium)
- **Security**: Cloudflare Tunnel

### Directory Structure
```
HeadySystems/
├── apps/
│   ├── heady-automation-ide/
│   │   ├── src/
│   │   │   ├── server/    # Express API
│   │   │   └── client/    # React UI
│   │   └── playwright/    # E2E tests
├── packages/
│   ├── ui/                # Shared components
│   └── core-domain/       # Business logic
├── scripts/               # DevOps scripts
├── .mcp/                  # MCP config
└── docker-compose.yml
```

## Testing

### Run Test Suite
```bash
# API tests with auth
node scripts/test-automation-api.js

# E2E tests
pnpm test:e2e

# Full verification
python scripts/verify_full_stack.py
```

## Docker Deployment

### Build & Run
```bash
docker-compose up -d --build
```

### Services
- **IDE**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Troubleshooting

### Port Conflicts
Change in `.env.local`:
```env
PORT=3001
```

### Missing Dependencies
```bash
pnpm install --frozen-lockfile
```

### Docker Issues
```bash
docker-compose down
docker system prune -a
docker-compose up --build
```

## Next Steps

1. ✅ Launch IDE via desktop shortcut
2. ✅ Test browser automation API
3. ✅ Configure MCP services
4. ✅ Deploy with Docker
5. ✅ Integrate with Windsurf

## Support

- **Repository**: https://github.com/HeadySystems/heady-automation-ide
- **Docs**: See `/docs` folder
- **Issues**: GitHub Issues

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>
