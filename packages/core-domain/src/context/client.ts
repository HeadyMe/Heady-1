/**
 * Context Client for Services
 * Allows any service to connect to and interact with the context system
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import type { SystemContext, ServiceState, ContextEvent } from './state-store.js';

export interface ContextClientOptions {
  serviceName: string;
  contextPath?: string;
  heartbeatInterval?: number;
  autoRegister?: boolean;
}

export class ContextClient extends EventEmitter {
  private serviceName: string;
  private contextPath: string;
  private heartbeatTimer?: NodeJS.Timeout;
  private heartbeatInterval: number;

  constructor(options: ContextClientOptions) {
    super();
    this.serviceName = options.serviceName;
    this.contextPath = options.contextPath || this.findContextFile();
    this.heartbeatInterval = options.heartbeatInterval || 30000;

    if (options.autoRegister !== false) {
      this.register();
    }
  }

  private findContextFile(): string {
    // Search up directory tree for .heady-context.json
    let dir = process.cwd();
    while (dir !== path.parse(dir).root) {
      const candidate = path.join(dir, '.heady-context.json');
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      dir = path.dirname(dir);
    }
    return path.join(process.cwd(), '.heady-context.json');
  }

  private readContext(): { version: number; events: ContextEvent[]; snapshot: SystemContext; savedAt: string } | null {
    try {
      if (fs.existsSync(this.contextPath)) {
        return JSON.parse(fs.readFileSync(this.contextPath, 'utf-8'));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to read context:', error);
    }
    return null;
  }

  private writeContext(ctx: { version: number; events: ContextEvent[]; snapshot: SystemContext; savedAt: string }): void {
    try {
      fs.writeFileSync(this.contextPath, JSON.stringify(ctx, null, 2));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to write context:', error);
    }
  }

  register(metadata: Record<string, unknown> = {}): void {
    const ctx = this.readContext();
    if (!ctx) {
      // eslint-disable-next-line no-console
      console.warn('Context file not found. Initialize with "hc context init"');
      return;
    }

    const event: ContextEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'SERVICE_REGISTERED',
      payload: { name: this.serviceName, metadata },
      timestamp: new Date().toISOString(),
      source: this.serviceName,
      version: ctx.version + 1,
    };

    // Update services in snapshot
    const existingIdx = ctx.snapshot.services.findIndex(s => s.name === this.serviceName);
    const service: ServiceState = {
      name: this.serviceName,
      status: 'online',
      lastHeartbeat: event.timestamp,
      metadata,
    };

    if (existingIdx >= 0) {
      ctx.snapshot.services[existingIdx] = service;
    } else {
      ctx.snapshot.services.push(service);
    }

    ctx.events.push(event);
    ctx.version = event.version;
    ctx.savedAt = new Date().toISOString();

    this.writeContext(ctx);
    this.emit('registered', { service, event });
  }

  startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.heartbeat('online');
    }, this.heartbeatInterval);

    // Send initial heartbeat
    this.heartbeat('online');
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  heartbeat(status: ServiceState['status'] = 'online'): void {
    const ctx = this.readContext();
    if (!ctx) return;

    const service = ctx.snapshot.services.find(s => s.name === this.serviceName);
    if (service) {
      service.status = status;
      service.lastHeartbeat = new Date().toISOString();

      const event: ContextEvent = {
        id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'SERVICE_HEARTBEAT',
        payload: { name: this.serviceName, status },
        timestamp: new Date().toISOString(),
        source: this.serviceName,
        version: ctx.version + 1,
      };

      ctx.events.push(event);
      ctx.version = event.version;
      ctx.savedAt = new Date().toISOString();

      // Keep only last 1000 events
      if (ctx.events.length > 1000) {
        ctx.events = ctx.events.slice(-1000);
      }

      this.writeContext(ctx);
      this.emit('heartbeat', { status, timestamp: event.timestamp });
    }
  }

  getState(): SystemContext | null {
    const ctx = this.readContext();
    return ctx?.snapshot || null;
  }

  getVersion(): number {
    const ctx = this.readContext();
    return ctx?.version || 0;
  }

  isServiceOnline(name: string): boolean {
    const state = this.getState();
    if (!state) return false;
    const service = state.services.find(s => s.name === name);
    if (!service) return false;
    
    // Check if heartbeat is stale (> 1 minute)
    const lastBeat = new Date(service.lastHeartbeat).getTime();
    const stale = (Date.now() - lastBeat) > 60000;
    
    return service.status === 'online' && !stale;
  }

  dispatch(type: string, payload: Record<string, unknown>): ContextEvent | null {
    const ctx = this.readContext();
    if (!ctx) return null;

    const event: ContextEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      source: this.serviceName,
      version: ctx.version + 1,
    };

    ctx.events.push(event);
    ctx.version = event.version;
    ctx.savedAt = new Date().toISOString();

    this.writeContext(ctx);
    this.emit('event', event);
    
    return event;
  }

  setActiveProject(projectId: string): void {
    const ctx = this.readContext();
    if (!ctx) return;

    ctx.snapshot.activeProject = projectId;
    this.dispatch('PROJECT_ACTIVATED', { projectId });
  }

  setActiveTask(taskId: string): void {
    const ctx = this.readContext();
    if (!ctx) return;

    ctx.snapshot.activeTask = taskId;
    this.dispatch('TASK_ACTIVATED', { taskId });
  }

  destroy(): void {
    this.stopHeartbeat();
    this.heartbeat('offline');
    this.removeAllListeners();
  }
}

// Factory function for easy service integration
export function createContextClient(serviceName: string, options?: Partial<ContextClientOptions>): ContextClient {
  return new ContextClient({
    serviceName,
    ...options,
  });
}
