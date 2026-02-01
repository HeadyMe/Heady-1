# Heady MCP Services Integration

## Overview

The Heady Automation IDE integrates with multiple Model Context Protocol (MCP) services to provide AI-powered task execution capabilities. This document describes the architecture, available services, and usage patterns.

## Architecture

### Components

1. **MCPClient** (`src/server/services/mcp-client.ts`)
   - Low-level JSON-RPC client for communicating with MCP servers
   - Manages process lifecycle and stdio communication
   - Handles request/response correlation

2. **MCPManager** (`src/server/services/mcp-manager.ts`)
   - Singleton service manager
   - Loads configuration from `.mcp/config.json`
   - Manages multiple MCP service instances
   - Auto-starts services on demand

3. **TaskRouter** (`src/server/services/task-router.ts`)
   - Intelligent task routing based on task type
   - Maps tasks to appropriate MCP services
   - Supports batch execution

## Available MCP Services

### 1. Heady MCP
- **Purpose**: Sacred geometry design system and Phi token generation
- **Use Cases**: 
  - Generate Phi-based spacing tokens
  - Create sacred geometry patterns
  - Design system calculations
- **Task Type**: `design_system`

### 2. GitHub Copilot
- **Purpose**: AI coding assistance and code search
- **Use Cases**:
  - Code completion
  - Code-related research
  - Pattern matching
- **Task Type**: `research`

### 3. Jules (Anthropic Claude)
- **Purpose**: Advanced AI task execution and code generation
- **Use Cases**:
  - Complex code generation
  - Refactoring
  - Architecture design
- **Task Type**: `code_generation`

### 4. HuggingFace
- **Purpose**: ML model integration
- **Use Cases**:
  - Model inference
  - Text generation
  - Classification tasks
- **Task Type**: `ml_inference`

### 5. Playwright
- **Purpose**: Browser automation
- **Use Cases**:
  - Automated testing
  - Web scraping
  - Screenshot capture
- **Task Type**: `browser_automation`

### 6. GitHub Gists
- **Purpose**: Code snippet management
- **Use Cases**:
  - Save code snippets
  - Share code examples
  - Template storage
- **Task Type**: `snippet_management`

## API Endpoints

### Health Check
```http
GET /api/health
```

Response includes MCP service status:
```json
{
  "status": "ok",
  "service": "heady-automation-ide",
  "mcp": {
    "available": ["heady", "jules", "github-copilot", ...],
    "running": ["jules"]
  }
}
```

### List MCP Services
```http
GET /api/mcp/services
```

### Start MCP Service
```http
POST /api/mcp/start/:service
Headers: x-api-key: your_api_key
```

### Stop MCP Service
```http
POST /api/mcp/stop/:service
Headers: x-api-key: your_api_key
```

### Execute Task
```http
POST /api/task/execute
Headers: 
  x-api-key: your_api_key
  Content-Type: application/json

Body:
{
  "type": "code_generation",
  "description": "Create a React component for user authentication",
  "context": {
    "framework": "React",
    "typescript": true
  }
}
```

Response:
```json
{
  "success": true,
  "result": { ... },
  "service": "jules",
  "executionTime": 1234
}
```

### Batch Execution
```http
POST /api/task/batch
Headers: x-api-key: your_api_key

Body:
{
  "tasks": [
    {
      "type": "code_generation",
      "description": "Create component A"
    },
    {
      "type": "research",
      "description": "Find best practices for component B"
    }
  ]
}
```

## Task Types

| Task Type | MCP Service | Description |
|-----------|-------------|-------------|
| `code_generation` | Jules | Complex code generation and refactoring |
| `research` | GitHub Copilot | Code search and research |
| `browser_automation` | Playwright | Browser automation tasks |
| `ml_inference` | HuggingFace | ML model inference |
| `snippet_management` | GitHub Gists | Code snippet storage |
| `design_system` | Heady | Sacred geometry and Phi tokens |

## Configuration

### Environment Variables

Required in `.env.local`:

```bash
# MCP Service Credentials
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=ghp_...
HUGGINGFACE_TOKEN=hf_...
JULES_API_KEY=your_jules_key
GITHUB_COPILOT_TOKEN=...

# MCP Endpoints (optional, for custom deployments)
HC_HEADY_MCP_ENDPOINT=http://localhost:7001
HC_JULES_ENDPOINT=http://localhost:7004

# Security
HC_AUTOMATION_API_KEY=your_secure_api_key
```

### MCP Config File

Located at `.mcp/config.json`:

```json
{
  "mcpServers": {
    "jules": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/claude-code-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      },
      "description": "Jules AI task execution"
    }
  }
}
```

## Usage Examples

### Example 1: Generate Code with Jules

```typescript
const task = {
  type: 'code_generation',
  description: 'Create a TypeScript function to calculate Fibonacci numbers',
  context: {
    language: 'typescript',
    includeTests: true
  }
};

const response = await fetch('/api/task/execute', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(task)
});

const result = await response.json();
console.log(result.result); // Generated code
```

### Example 2: Browser Automation with Playwright

```typescript
const task = {
  type: 'browser_automation',
  description: 'Navigate to example.com and extract the page title',
  context: {
    url: 'https://example.com',
    action: 'extract_title'
  }
};
```

### Example 3: Design System with Heady MCP

```typescript
const task = {
  type: 'design_system',
  description: 'Generate Phi-based spacing tokens for a design system',
  context: {
    baseUnit: 8,
    scale: 'golden_ratio'
  }
};
```

### Example 4: Batch Execution

```typescript
const tasks = [
  {
    type: 'code_generation',
    description: 'Create authentication component'
  },
  {
    type: 'code_generation',
    description: 'Create user profile component'
  },
  {
    type: 'research',
    description: 'Find best practices for React hooks'
  }
];

const response = await fetch('/api/task/batch', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ tasks })
});
```

## Service Lifecycle

### Auto-Start
Services are automatically started when a task is routed to them. No manual start required.

### Manual Control
```bash
# Start a service
curl -X POST http://localhost:4100/api/mcp/start/jules \
  -H "x-api-key: your_key"

# Stop a service
curl -X POST http://localhost:4100/api/mcp/stop/jules \
  -H "x-api-key: your_key"
```

### Graceful Shutdown
All MCP services are automatically stopped when the server receives SIGTERM or SIGINT.

## Error Handling

### Common Errors

1. **Service Not Found**
   ```json
   {
     "error": "MCP service 'unknown' not found in config"
   }
   ```

2. **Missing API Key**
   ```json
   {
     "error": "Unauthorized"
   }
   ```

3. **Task Execution Failure**
   ```json
   {
     "success": false,
     "error": "Request timeout",
     "service": "jules",
     "executionTime": 30000
   }
   ```

## Performance Considerations

- **Service Startup**: First request to a service incurs ~1-2s startup time
- **Request Timeout**: 30 seconds per MCP request
- **Concurrent Requests**: Services handle requests sequentially
- **Batch Execution**: Tasks execute in parallel across different services

## Security

1. **API Key Required**: All MCP endpoints require `x-api-key` header
2. **CORS Protection**: Strict origin allowlist
3. **Environment Isolation**: Each MCP service runs in isolated process
4. **Credential Management**: API keys loaded from environment, never hardcoded

## Troubleshooting

### Service Won't Start
- Check API keys in `.env.local`
- Verify service command is installed (`npx`, `node`, etc.)
- Check logs for specific error messages

### Request Timeout
- Increase timeout in `mcp-client.ts` if needed
- Check network connectivity for remote services
- Verify service is responding to health checks

### Missing Configuration
- Ensure `.mcp/config.json` exists
- Validate JSON syntax
- Check environment variable substitution

## Future Enhancements

- [ ] WebSocket support for streaming responses
- [ ] Service health monitoring and auto-restart
- [ ] Request queuing and rate limiting
- [ ] Service metrics and analytics
- [ ] UI for service management
- [ ] Custom MCP service registration

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>
