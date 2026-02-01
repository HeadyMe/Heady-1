# Windsurf Integration — Heady Automation IDE

This guide adapts the provided Windsurf prompt to the **HeadySystems monorepo** while preserving the original instructions for anyone using the standalone repository.

## ✅ Project Context
- **Repo (this workspace):** `C:\Users\erich\CascadeProjects\HeadySystems`
- **App location:** `apps/heady-automation-ide`
- **IDE UI (dev):** http://localhost:5173
- **IDE API (dev):** http://localhost:4100/api/health
- **IDE UI/API (docker):** http://localhost:4100

## Quick Start (Monorepo)
```bash
pnpm install
pnpm dev --filter heady-automation-ide
```

## Quick Start (Standalone Repo)
If you clone `https://github.com/HeadySystems/heady-automation-ide` directly:
```bash
git clone https://github.com/HeadySystems/heady-automation-ide.git
cd heady-automation-ide
npm install
cp .env.example .env
npm run setup:desktop
npm run dev
```
Or Docker:
```bash
docker-compose up -d
```

## Security & API Access
Set an API key to guard automation endpoints:
```env
HC_AUTOMATION_API_KEY=your_secure_api_key_here
VITE_AUTOMATION_API_KEY=your_secure_api_key_here
```
The IDE UI sends `x-api-key` when `VITE_AUTOMATION_API_KEY` is configured.

Restrict origins as needed:
```env
HC_ALLOW_NONLOCAL_ORIGINS=false
HC_AUTOMATION_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4100
```

## MCP Service Integration
This repo ships an MCP config template at `mcp-config.yaml`. Configure your endpoints in `.env.local`.

If Windsurf expects a `.mcp/config.json`, use the following template:
```json
{
  "servers": {
    "heady": {
      "transport": "http",
      "endpoint": "${HC_HEADY_MCP_ENDPOINT}"
    },
    "perplexity": {
      "transport": "http",
      "endpoint": "${HC_PERPLEXITY_ENDPOINT}"
    },
    "gemini": {
      "transport": "http",
      "endpoint": "${HC_GEMINI_ENDPOINT}"
    },
    "jules": {
      "transport": "http",
      "endpoint": "${HC_JULES_ENDPOINT}"
    }
  }
}
```

## Desktop Shortcuts
Create desktop shortcuts (Windows/macOS/Linux):
```bash
npm run setup:desktop
```
This creates:
- **Launch Heady IDE** — runs `pnpm dev --filter heady-automation-ide`
- **Start Heady Docker** — runs `docker-compose up -d --build`

## Deployment & Verification
Local deploy helper:
```powershell
./scripts/deploy_heady_full_stack.ps1
```
Health check:
```bash
python scripts/verify_full_stack.py
```

---

## Original Windsurf Prompt (Reference)
> **Project Repository:** https://github.com/HeadySystems/heady-automation-ide
>
> **Key Features**
> - MCP service integration (.mcp/config.json)
> - Multi‑mode execution (IDE/Browser/Docker)
> - Desktop integration via `npm run setup:desktop`
> - Infrastructure: Node/Express, PostgreSQL, Redis, Cloudflare Tunnel
> - Dev tools: TypeScript, ESLint, Prettier, Vitest, Playwright
>
> **Expected Outcomes**
> ✅ Launch IDE via desktop shortcut or CLI
> ✅ Execute browser automation tasks
> ✅ Connect to MCP services
> ✅ Deploy via Docker
> ✅ Use AI coding assistants
> ✅ Secure remote access via Cloudflare Tunnel

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>
