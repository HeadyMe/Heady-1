# 🚀 Windsurf Integration Prompt for Heady Automation IDE
Project Repository: https://github.com/HeadySystems/heady-automation-ide

## Project Overview
Clone and integrate the Heady Automation IDE - a comprehensive DevOps automation system with Windsurf-style IDE integration and browser automation for task assignment and execution. This system provides a complete development environment with MCP (Model Context Protocol) service integrations.

## Quick Start Commands
```bash
# Clone the repository
git clone https://github.com/HeadySystems/heady-automation-ide.git
cd heady-automation-ide

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Create desktop shortcuts (optional)
npm run setup:desktop

# Start development mode
npm run dev

# Or launch via Docker
docker-compose up -d
```

## Key Features to Understand
### 1. MCP Service Integration (.mcp/config.json):
- **Heady MCP**: Core automation service with Phi token support
- **GitHub Copilot**: AI coding assistance
- **Jules (Anthropic)**: Advanced AI task execution
- **HuggingFace**: ML model integration
- **Playwright**: Browser automation toolkit
- **GitHub Gists**: Code snippet management

### 2. Multi-Mode Execution:
- **IDE Mode**: Full development environment with code editor
- **Browser Mode**: Headless/interactive browser automation
- **Docker Mode**: Containerized deployment with PostgreSQL, Redis, and Cloudflare Tunnel

### 3. Desktop Integration:
- Cross-platform desktop shortcuts (Windows .bat, macOS/Linux .sh, Linux .desktop)
- One-click launch for each mode
- Automated setup via `npm run setup:desktop`

### 4. Infrastructure Stack:
- **Backend**: Node.js with TypeScript, Express (Port 4100)
- **Database**: PostgreSQL for persistent storage (Port 5435)
- **Cache**: Redis for session management (Port 6385)
- **Security**: Cloudflare Tunnel for secure remote access
- **Deployment**: Render.com and Cloudflare Workers support

### 5. Development Tools:
- TypeScript with strict type checking
- ESLint + Prettier for code quality
- Vitest for testing with coverage
- Docker Desktop support with comprehensive testing guide

## Integration Tasks for Windsurf
### Connect to MCP Services:
- Review `.mcp/config.json` to understand available services
- Configure API keys in `.env` file
- Test connectivity with each MCP service

### Set Up Development Environment:
- Install Node.js dependencies
- Configure environment variables for local development
- Set up Docker containers if needed

### Create Desktop Shortcuts:
- Run `npm run setup:desktop` to create clickable desktop icons
- Verify shortcuts launch correctly in each mode (IDE, Browser, Docker)

### Understand the Architecture:
- Review `README.md` for connection instructions
- Check `DOCKER_SETUP.md` for containerization details
- Examine `package.json` scripts for available commands

### Deploy and Test:
- Run `npm run dev` for local development
- Use `docker-compose up` for full stack deployment
- Test browser automation capabilities with Playwright

## Configuration Files to Review
- `.env.example`: Template for all environment variables (API keys, database credentials, feature flags)
- `package.json`: Dependencies, scripts, and project metadata
- `docker-compose.yml`: Multi-service container orchestration
- `Dockerfile`: Application containerization with security best practices
- `desktop/`: Desktop launchers folder with platform-specific launch scripts

## Expected Outcomes
After integration, you should be able to:
- ✅ Launch the IDE via desktop shortcut or command line
- ✅ Execute browser automation tasks through Playwright
- ✅ Connect to all configured MCP services
- ✅ Deploy via Docker with full stack (DB, cache, tunnel)
- ✅ Use AI coding assistants (Copilot, Jules, HuggingFace)
- ✅ Manage secure remote access via Cloudflare Tunnel

## Access Points (Configured)
- **IDE Web UI**: http://localhost:4100
- **PostgreSQL**: localhost:5435
- **Redis**: localhost:6385

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>

