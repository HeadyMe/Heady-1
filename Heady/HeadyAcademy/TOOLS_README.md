# HEADY TOOLS LIBRARY

## Overview
The `/tools` directory contains extracted, formalized components from the HeadySystems codebase for dynamic reuse across the platform.

## Directory Structure
```
tools/
├── scripts/          # PowerShell automation modules
├── mcp/             # MCP tool definitions for AI agents
└── ui/              # Reusable UI components
```

## Available Tools

### Scripts (`/tools/scripts/`)

#### HeadyCore.psm1
PowerShell module with core system functions:

- `Initialize-HeadySecrets` - Load environment variables from .env
- `Optimize-HeadyRepo` - Git optimization and cleanup
- `Initialize-HeadyProject` - Project scaffolding
- `Setup-HeadyRemotes` - Configure git remotes

**Usage:**
```powershell
Import-Module .\tools\scripts\HeadyCore.psm1
Initialize-HeadySecrets
Optimize-HeadyRepo
```

### MCP Tools (`/tools/mcp/`)

#### secret-manager.js
AI-accessible secret management tool:

**Actions:**
- `load` - Load secrets from .env file
- `validate` - Validate secret patterns
- `sanitize` - Remove secrets from content for logging

**API Endpoint:** `POST /api/tools/secret_manager`

**Example:**
```json
{
  "action": "validate"
}
```

### UI Components (`/tools/ui/`)

#### sacred-components.jsx
React components for Sacred Interface:

- `SacredLogo` - Animated logo with pulse effect
- `StatusDisplay` - Status text component
- `SacredContainer` - Main layout container
- `OrbitCard` - Node status cards
- `SacredInterface` - Complete interface layout

**Usage:**
```jsx
import { SacredInterface } from './tools/ui/sacred-components';

<SacredInterface 
  nodes={[{name: 'Core', status: 'Active'}]}
  status="Harmonic"
/>
```

## Integration Points

### heady-manager.js
- Registers MCP tools in `TOOLS_REGISTRY`
- Provides `/api/tools/:toolName` endpoint
- Reports tool count in health checks

### Package.json
Tools are accessible through the main application without additional dependencies.

## Invocation Methods

### Direct API Calls
```bash
curl -X POST http://localhost:3300/api/tools/secret_manager \
  -H "Content-Type: application/json" \
  -d '{"action": "validate"}'
```

### PowerShell Import
```powershell
Import-Module .\tools\scripts\HeadyCore.psm1
Initialize-HeadySecrets
```

### React Integration
```jsx
import SacredComponents from './tools/ui/sacred-components';
```

## Security Notes
- Secret manager automatically sanitizes sensitive data
- All tools follow principle of least privilege
- Environment variables are process-scoped only

## Extension
To add new tools:
1. Create tool file in appropriate `/tools` subdirectory
2. Register in `heady-manager.js` TOOLS_REGISTRY
3. Update this documentation
4. Test via API endpoints

---
<div align="center">
  <p>Made with ❤️ by HeadySystems</p>
</div>