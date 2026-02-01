---
description: Integrate and test Model Context Protocol (MCP) services
---
# MCP Integration Workflow

This workflow guides you through testing and verifying the Model Context Protocol (MCP) integration within the Heady System. MCP allows the IDE to leverage external tools and AI capabilities.

1. **Verify MCP Server (Direct)**
   Test the MCP server process directly using JSON-RPC over stdio. This checks if the core server and tools are loading correctly.
   ```powershell
   // turbo
   node scripts/verify-mcp-new.js
   ```

2. **Test API Integration**
   Test the integration between the IDE backend and the MCP services via the REST API. This covers health checks, service listing, and task execution.
   ```powershell
   // turbo
   node scripts/test-mcp-integration.js
   ```

3. **Execute Example Tasks**
   Run specific example tasks to verify tool functionality (Code Generation, Design System, Browser Automation).
   *Note: Requires Git Bash or WSL for .sh scripts, or manual execution of curl commands.*
   ```bash
   ./scripts/example-mcp-tasks.sh
   ```

## Common MCP Tasks
You can trigger these tasks via the API (`POST /api/task/execute`):
- **Code Generation**: Generate functions, components, or tests.
- **Design System**: Generate tokens, palettes, or spacing scales.
- **Research**: Query knowledge bases or external docs.
- **Browser Automation**: Scrape or interact with web pages.

## Troubleshooting
- **Server Verification Fails**: Check `packages/core-domain/dist/mcp-server.js` exists and dependencies are installed.
- **API Tests Fail**: Ensure the main IDE server is running (`pnpm dev:server`).
