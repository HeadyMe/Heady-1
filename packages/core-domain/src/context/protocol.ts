/**
 * Context Synchronization Protocol
 * Enables deterministic state sharing across Heady services
 */

import { z } from 'zod';

// Protocol message schemas for type-safe communication
export const ContextMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SYNC_REQUEST'),
    fromVersion: z.number(),
    requestId: z.string(),
  }),
  z.object({
    type: z.literal('SYNC_RESPONSE'),
    events: z.array(z.object({
      id: z.string(),
      type: z.string(),
      payload: z.record(z.unknown()),
      timestamp: z.string(),
      source: z.string(),
      version: z.number(),
    })),
    currentVersion: z.number(),
    requestId: z.string(),
  }),
  z.object({
    type: z.literal('STATE_QUERY'),
    path: z.string().optional(),
    requestId: z.string(),
  }),
  z.object({
    type: z.literal('STATE_RESPONSE'),
    data: z.unknown(),
    version: z.number(),
    requestId: z.string(),
  }),
  z.object({
    type: z.literal('EVENT_BROADCAST'),
    event: z.object({
      id: z.string(),
      type: z.string(),
      payload: z.record(z.unknown()),
      timestamp: z.string(),
      source: z.string(),
      version: z.number(),
    }),
  }),
  z.object({
    type: z.literal('HEARTBEAT'),
    serviceName: z.string(),
    status: z.enum(['online', 'offline', 'degraded', 'unknown']),
    timestamp: z.string(),
  }),
]);

export type ContextMessage = z.infer<typeof ContextMessageSchema>;

// Deterministic hash for event ordering
export function computeEventHash(event: { type: string; payload: unknown; timestamp: string }): string {
  const data = JSON.stringify({ type: event.type, payload: event.payload, timestamp: event.timestamp });
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Context paths for querying specific state
export const ContextPaths = {
  ROOT: '/',
  SERVICES: '/services',
  SERVICE: (name: string) => `/services/${name}`,
  ACTIVE_PROJECT: '/activeProject',
  ACTIVE_TASK: '/activeTask',
  ENVIRONMENT: '/environment',
  SESSION: '/session',
} as const;

// Query state by path
export function queryStatePath(state: Record<string, unknown>, path: string): unknown {
  if (path === '/' || path === '') return state;
  
  const parts = path.split('/').filter(Boolean);
  let current: unknown = state;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

// Protocol version for compatibility checking
export const PROTOCOL_VERSION = '1.0.0';

// Service discovery registry
export interface ServiceDescriptor {
  name: string;
  version: string;
  capabilities: string[];
  endpoints: {
    health?: string;
    api?: string;
    ws?: string;
  };
}

export const KnownServices: Record<string, Partial<ServiceDescriptor>> = {
  'heady-ide': {
    name: 'heady-ide',
    capabilities: ['automation', 'editor', 'websocket'],
    endpoints: {
      health: '/api/health',
      api: '/api',
      ws: '/socket.io',
    },
  },
  'heady-api': {
    name: 'heady-api',
    capabilities: ['tasks', 'projects', 'users', 'automation'],
    endpoints: {
      health: '/health',
      api: '/api',
    },
  },
  'browser-automation': {
    name: 'browser-automation',
    capabilities: ['playwright', 'headless', 'screenshots'],
    endpoints: {
      health: '/health',
      api: '/api',
    },
  },
  'context-mcp': {
    name: 'context-mcp',
    capabilities: ['context', 'state', 'events', 'sync'],
    endpoints: {},
  },
};

// Context change observer interface
export interface ContextObserver {
  onEvent(event: { type: string; payload: unknown }): void;
  onStateChange(path: string, oldValue: unknown, newValue: unknown): void;
}

// Deterministic timestamp generator (for testing/replay)
export class DeterministicClock {
  private baseTime: number;
  private offset: number = 0;

  constructor(baseTime?: number) {
    this.baseTime = baseTime || Date.now();
  }

  now(): number {
    return this.baseTime + this.offset;
  }

  nowISO(): string {
    return new Date(this.now()).toISOString();
  }

  advance(ms: number): void {
    this.offset += ms;
  }

  reset(): void {
    this.offset = 0;
  }

  setBase(time: number): void {
    this.baseTime = time;
    this.offset = 0;
  }
}
