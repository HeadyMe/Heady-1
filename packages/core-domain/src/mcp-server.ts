import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { getContextStore } from "./context/state-store.js";
import { queryStatePath, PROTOCOL_VERSION } from "./context/protocol.js";
import * as os from 'os';

dotenv.config();

// Configuration
const CONFIG = {
  NAME: process.env.MCP_SERVER_NAME || "heady-context-mcp",
  VERSION: process.env.MCP_SERVER_VERSION || "1.1.0",
  LOG_LEVEL: process.env.MCP_LOG_LEVEL || "info",
  HEARTBEAT_INTERVAL: parseInt(process.env.MCP_HEARTBEAT_INTERVAL || "30000"),
};

// Structured Logger
class Logger {
  private level: number;
  private levels = { debug: 0, info: 1, warn: 2, error: 3 };

  constructor(level: string) {
    this.level = this.levels[level as keyof typeof this.levels] || 1;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(level: string, message: string, meta?: any) {
    const currentLevel = this.levels[level as keyof typeof this.levels] || 1;
    if (currentLevel >= this.level) {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
      };
      // Write to stderr to avoid interfering with MCP stdio protocol
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(entry));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, meta?: any) { this.log('debug', message, meta); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, meta?: any) { this.log('info', message, meta); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, meta?: any) { this.log('warn', message, meta); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, meta?: any) { this.log('error', message, meta); }
}

const logger = new Logger(CONFIG.LOG_LEVEL);
const contextStore = getContextStore();

// Register this MCP server as a service
contextStore.registerService('context-mcp', {
  version: CONFIG.VERSION,
  capabilities: ['context', 'state', 'events', 'tools', 'diagnostics', 'sacred-geometry'],
  protocolVersion: PROTOCOL_VERSION,
  config: CONFIG
});

const server = new Server(
  {
    name: CONFIG.NAME,
    version: CONFIG.VERSION,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Phi Token Utility
const calculatePhiToken = (input: string) => {
  const phi = 1.618033988749895;
  return `PHI-${Buffer.from(input).toString('base64')}-${phi}`;
};

// Sacred Geometry Generator
const generateSacredGeometry = (type: string, scale: number = 100) => {
  const phi = 1.618033988749895;
  switch (type) {
    case 'golden_spiral':
      return {
        type: 'svg',
        viewBox: `0 0 ${scale * phi} ${scale}`,
        path: `M0,${scale} A${scale},${scale} 0 0 1 ${scale},0 L${scale},${scale} Z`, // Simplified approx
        css: {
            '--golden-ratio': `${phi}`,
            '--scale': `${scale}px`
        }
      };
    case 'flower_of_life': {
        const r = scale / 2;
        return {
            type: 'svg',
            circles: [
                { cx: r, cy: r, r },
                { cx: r * 2, cy: r, r }, // Simplified
            ],
            description: "Overlapping circles in hexagonal symmetry"
        };
    }
    default:
        return {
            type: 'fibonacci_grid',
            values: [1, 1, 2, 3, 5, 8, 13, 21].map(n => n * (scale/10))
        };
  }
};

// Tool definitions
const TOOLS = [
  {
    name: "get_context",
    description: "Get the current system context state. Returns all tracked services, active project/task, and environment info.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Optional path to query specific context (e.g., '/services', '/activeProject')",
        },
      },
    },
  },
  {
    name: "dispatch_event",
    description: "Dispatch a context event to the state store. Events are recorded for deterministic replay.",
    inputSchema: {
      type: "object",
      properties: {
        eventType: {
          type: "string",
          description: "Type of event (e.g., 'PROJECT_ACTIVATED', 'TASK_ACTIVATED')",
        },
        payload: {
          type: "object",
          description: "Event payload data",
        },
        source: {
          type: "string",
          description: "Source of the event",
        },
      },
      required: ["eventType", "payload"],
    },
  },
  {
    name: "search_context",
    description: "Advanced search for context events and state. Filter by time, type, or regex content.",
    inputSchema: {
        type: "object",
        properties: {
            query: { type: "string", description: "Text or Regex to search in event payloads" },
            startTime: { type: "string", description: "ISO timestamp start" },
            endTime: { type: "string", description: "ISO timestamp end" },
            type: { type: "string", description: "Event type to filter" },
            source: { type: "string", description: "Event source to filter" },
            limit: { type: "number", description: "Max results" }
        }
    }
  },
  {
    name: "generate_sacred_geometry",
    description: "Generate sacred geometry patterns and tokens for design systems.",
    inputSchema: {
        type: "object",
        properties: {
            type: { 
                type: "string", 
                enum: ["golden_spiral", "flower_of_life", "fibonacci_grid"],
                description: "Type of geometry to generate"
            },
            scale: { type: "number", description: "Base scale unit" }
        },
        required: ["type"]
    }
  },
  {
    name: "system_diagnostics",
    description: "Get comprehensive system health, memory usage, and runtime metrics.",
    inputSchema: {
        type: "object",
        properties: {
            detailLevel: { type: "string", enum: ["basic", "full"] }
        }
    }
  },
  {
    name: "register_service",
    description: "Register a service with the context system.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        metadata: { type: "object" },
      },
      required: ["name"],
    },
  },
  {
    name: "service_heartbeat",
    description: "Send a heartbeat for a registered service.",
    inputSchema: {
      type: "object",
      properties: {
        serviceName: { type: "string" },
        status: { type: "string", enum: ["online", "degraded", "offline"] },
      },
      required: ["serviceName"],
    },
  },
  {
    name: "set_active_project",
    description: "Set the currently active project in the context.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  {
    name: "set_active_task",
    description: "Set the currently active task in the context.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "get_events",
    description: "Get context events, optionally filtered by timestamp.",
    inputSchema: {
      type: "object",
      properties: {
        since: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "sync_context",
    description: "Trigger a context synchronization checkpoint.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "calculate_phi_token",
    description: "Generate a Phi token for sacred geometry design systems",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string" },
      },
      required: ["input"],
    },
  },
  {
    name: "configure_server",
    description: "Update server runtime configuration.",
    inputSchema: {
        type: "object",
        properties: {
            logLevel: { type: "string", enum: ["debug", "info", "warn", "error"] },
            heartbeatInterval: { type: "number" }
        }
    }
  }
];

// Handlers

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "context://state",
        name: "System Context State",
        description: "Current state of the Heady ecosystem context",
        mimeType: "application/json",
      },
      {
        uri: "context://events",
        name: "Context Events",
        description: "Event log for context changes",
        mimeType: "application/json",
      },
      {
        uri: "context://services",
        name: "Registered Services",
        description: "All registered services and their status",
        mimeType: "application/json",
      },
      {
        uri: "context://diagnostics",
        name: "System Diagnostics",
        description: "Real-time system health and metrics",
        mimeType: "application/json",
      },
      {
        uri: "context://config",
        name: "Server Configuration",
        description: "Current server runtime configuration",
        mimeType: "application/json",
      }
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  logger.debug(`Reading resource: ${uri}`);
  
  try {
    switch (uri) {
        case "context://state":
        return {
            contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(contextStore.getState(), null, 2),
            }],
        };
        case "context://events":
        return {
            contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(contextStore.getEvents(), null, 2),
            }],
        };
        case "context://services":
        return {
            contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(contextStore.getState().services, null, 2),
            }],
        };
        case "context://diagnostics":
        return {
            contents: [{
                uri,
                mimeType: "application/json",
                text: JSON.stringify({
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: os.loadavg(),
                    platform: os.platform(),
                    services: contextStore.getState().services.length,
                    events: contextStore.getEvents().length
                }, null, 2)
            }]
        };
        case "context://config":
        return {
            contents: [{
                uri,
                mimeType: "application/json",
                text: JSON.stringify(CONFIG, null, 2)
            }]
        };
        default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    }
  } catch (error) {
    logger.error(`Error reading resource ${uri}`, { error });
    throw error;
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.info(`Calling tool: ${name}`, { args });
  
  try {
    switch (name) {
        case "get_context": {
        const { path } = (args || {}) as { path?: string };
        const state = contextStore.getState();
        const result = path ? queryStatePath(state as unknown as Record<string, unknown>, path) : state;
        return {
            content: [{
            type: "text",
            text: JSON.stringify({
                data: result,
                version: contextStore.getVersion(),
                queriedAt: new Date().toISOString(),
            }, null, 2),
            }],
        };
        }

        case "search_context": {
            const { query, startTime, endTime, type, source, limit } = (args || {}) as any;
            let events = contextStore.getEvents();

            if (startTime) events = events.filter(e => e.timestamp >= startTime);
            if (endTime) events = events.filter(e => e.timestamp <= endTime);
            if (type) events = events.filter(e => e.type === type);
            if (source) events = events.filter(e => e.source === source);
            
            if (query) {
                const regex = new RegExp(query, 'i');
                events = events.filter(e => 
                    regex.test(JSON.stringify(e.payload)) || 
                    regex.test(e.type) || 
                    regex.test(e.source)
                );
            }

            if (limit) events = events.slice(-limit);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        count: events.length,
                        results: events
                    }, null, 2)
                }]
            };
        }

        case "generate_sacred_geometry": {
            const { type, scale } = args as { type: string, scale?: number };
            const geometry = generateSacredGeometry(type, scale);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(geometry, null, 2)
                }]
            };
        }

        case "system_diagnostics": {
            const { detailLevel } = (args || {}) as { detailLevel?: string };
            const stats = {
                server: {
                    name: CONFIG.NAME,
                    version: CONFIG.VERSION,
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    pid: process.pid,
                    nodeVersion: process.version
                },
                os: {
                    platform: os.platform(),
                    release: os.release(),
                    loadAvg: os.loadavg(),
                    totalMem: os.totalmem(),
                    freeMem: os.freemem()
                },
                context: {
                    eventCount: contextStore.getEvents().length,
                    serviceCount: contextStore.getState().services.length,
                    version: contextStore.getVersion()
                }
            };
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }

        case "configure_server": {
            const { logLevel, heartbeatInterval } = args as any;
            if (logLevel) CONFIG.LOG_LEVEL = logLevel;
            if (heartbeatInterval) CONFIG.HEARTBEAT_INTERVAL = heartbeatInterval;
            
            logger.info("Server configuration updated", CONFIG);
            
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ success: true, config: CONFIG }, null, 2)
                }]
            };
        }

        case "dispatch_event": {
        const { eventType, payload, source } = args as { 
            eventType: string; 
            payload: Record<string, unknown>; 
            source?: string 
        };
        const event = contextStore.dispatch(eventType, payload, source || 'mcp-client');
        return {
            content: [{
            type: "text",
            text: JSON.stringify({ success: true, event }, null, 2),
            }],
        };
        }

        case "register_service": {
        const { name: serviceName, metadata } = args as { 
            name: string; 
            metadata?: Record<string, unknown> 
        };
        contextStore.registerService(serviceName, metadata || {});
        return {
            content: [{
            type: "text",
            text: JSON.stringify({ 
                success: true, 
                message: `Service '${serviceName}' registered`,
                services: contextStore.getState().services,
            }, null, 2),
            }],
        };
        }

        case "service_heartbeat": {
        const { serviceName, status } = args as { 
            serviceName: string; 
            status?: 'online' | 'degraded' | 'offline' 
        };
        contextStore.heartbeat(serviceName, status || 'online');
        return {
            content: [{
            type: "text",
            text: JSON.stringify({ 
                success: true, 
                service: contextStore.getServiceState(serviceName),
            }, null, 2),
            }],
        };
        }

        case "set_active_project": {
        const { projectId } = args as { projectId: string };
        contextStore.setActiveProject(projectId);
        return {
            content: [{
            type: "text",
            text: JSON.stringify({ 
                success: true, 
                activeProject: projectId,
            }, null, 2),
            }],
        };
        }

        case "set_active_task": {
        const { taskId } = args as { taskId: string };
        contextStore.setActiveTask(taskId);
        return {
            content: [{
            type: "text",
            text: JSON.stringify({ 
                success: true, 
                activeTask: taskId,
            }, null, 2),
            }],
        };
        }

        case "get_events": {
        const { since, limit } = (args || {}) as { since?: string; limit?: number };
        let events = contextStore.getEvents(since);
        if (limit && limit > 0) {
            events = events.slice(-limit);
        }
        return {
            content: [{
            type: "text",
            text: JSON.stringify({ 
                events,
                count: events.length,
                version: contextStore.getVersion(),
            }, null, 2),
            }],
        };
        }

        case "sync_context": {
        contextStore.sync();
        return {
            content: [{
            type: "text",
            text: JSON.stringify({ 
                success: true, 
                version: contextStore.getVersion(),
                syncedAt: new Date().toISOString(),
            }, null, 2),
            }],
        };
        }

        case "calculate_phi_token": {
        const { input } = args as { input: string };
        const token = calculatePhiToken(input);
        return {
            content: [{
            type: "text",
            text: JSON.stringify({ token, valid: true }),
            }],
        };
        }

        default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    logger.error(`Error executing tool ${name}`, { error: error.message, stack: error.stack });
    return {
        content: [{
            type: "text",
            text: JSON.stringify({ 
                error: error.message,
                status: "failed",
                timestamp: new Date().toISOString()
            }, null, 2)
        }],
        isError: true
    };
  }
});

// Heartbeat interval for self-registration
setInterval(() => {
  contextStore.heartbeat(CONFIG.NAME, 'online');
}, CONFIG.HEARTBEAT_INTERVAL);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`Heady Context MCP Server running on stdio`, {
      name: CONFIG.NAME,
      version: CONFIG.VERSION,
      protocol: PROTOCOL_VERSION
  });
}

main().catch((error) => {
  console.error("Fatal error in main loop:", error);
  process.exit(1);
});
