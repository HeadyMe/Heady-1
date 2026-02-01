/**
 * Deterministic State Store with Event Sourcing
 * Provides context awareness across the Heady ecosystem
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface ContextEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
  source: string;
  version: number;
}

export interface SystemContext {
  sessionId: string;
  startedAt: string;
  services: ServiceState[];
  activeProject?: string;
  activeTask?: string;
  environment: Record<string, string>;
  lastSync: string;
}

export interface ServiceState {
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  lastHeartbeat: string;
  metadata: Record<string, unknown>;
}

export class DeterministicStateStore extends EventEmitter {
  private events: ContextEvent[] = [];
  private state: SystemContext;
  private persistPath: string;
  private version: number = 0;

  constructor(persistPath?: string) {
    super();
    this.persistPath = persistPath || path.join(process.cwd(), '.heady-context.json');
    this.state = this.initializeState();
    this.loadPersistedState();
  }

  private initializeState(): SystemContext {
    return {
      sessionId: this.generateDeterministicId('session'),
      startedAt: new Date().toISOString(),
      services: [],
      environment: this.captureEnvironment(),
      lastSync: new Date().toISOString(),
    };
  }

  private generateDeterministicId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    return `${prefix}-${timestamp.toString(36)}-${random}`;
  }

  private captureEnvironment(): Record<string, string> {
    const relevantVars = [
      'NODE_ENV', 'PORT', 'DATABASE_URL', 'REDIS_URL',
      'HC_API_URL', 'HC_PROJECT_ID', 'HC_WORKSPACE'
    ];
    const env: Record<string, string> = {};
    for (const key of relevantVars) {
      if (process.env[key]) {
        env[key] = key.includes('URL') || key.includes('SECRET') 
          ? '[CONFIGURED]' 
          : process.env[key]!;
      }
    }
    return env;
  }

  private loadPersistedState(): void {
    try {
      if (fs.existsSync(this.persistPath)) {
        const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf-8'));
        this.events = data.events || [];
        this.version = data.version || 0;
        this.replayEvents();
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  private persistState(): void {
    try {
      const data = {
        version: this.version,
        events: this.events.slice(-1000), // Keep last 1000 events
        snapshot: this.state,
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  private replayEvents(): void {
    for (const event of this.events) {
      this.applyEvent(event, false);
    }
  }

  private applyEvent(event: ContextEvent, persist: boolean = true): void {
    switch (event.type) {
      case 'SERVICE_REGISTERED':
        this.handleServiceRegistered(event);
        break;
      case 'SERVICE_HEARTBEAT':
        this.handleServiceHeartbeat(event);
        break;
      case 'PROJECT_ACTIVATED':
        this.state.activeProject = event.payload.projectId as string;
        break;
      case 'TASK_ACTIVATED':
        this.state.activeTask = event.payload.taskId as string;
        break;
      case 'CONTEXT_SYNCED':
        this.state.lastSync = event.timestamp;
        break;
      case 'ENVIRONMENT_UPDATED':
        Object.assign(this.state.environment, event.payload);
        break;
    }

    if (persist) {
      this.events.push(event);
      this.version++;
      this.persistState();
      this.emit('stateChanged', { event, state: this.state });
    }
  }

  private handleServiceRegistered(event: ContextEvent): void {
    const { name, metadata } = event.payload as { name: string; metadata: Record<string, unknown> };
    const existingIndex = this.state.services.findIndex(s => s.name === name);
    const service: ServiceState = {
      name,
      status: 'online',
      lastHeartbeat: event.timestamp,
      metadata: metadata || {},
    };
    
    if (existingIndex >= 0) {
      this.state.services[existingIndex] = service;
    } else {
      this.state.services.push(service);
    }
  }

  private handleServiceHeartbeat(event: ContextEvent): void {
    const { name, status } = event.payload as { name: string; status?: string };
    const service = this.state.services.find(s => s.name === name);
    if (service) {
      service.lastHeartbeat = event.timestamp;
      service.status = (status as ServiceState['status']) || 'online';
    }
  }

  // Public API
  dispatch(type: string, payload: Record<string, unknown>, source: string = 'system'): ContextEvent {
    const event: ContextEvent = {
      id: this.generateDeterministicId('evt'),
      type,
      payload,
      timestamp: new Date().toISOString(),
      source,
      version: this.version + 1,
    };
    this.applyEvent(event);
    return event;
  }

  getState(): SystemContext {
    return { ...this.state };
  }

  getEvents(since?: string): ContextEvent[] {
    if (!since) return [...this.events];
    return this.events.filter(e => e.timestamp > since);
  }

  getVersion(): number {
    return this.version;
  }

  registerService(name: string, metadata: Record<string, unknown> = {}): void {
    this.dispatch('SERVICE_REGISTERED', { name, metadata }, name);
  }

  heartbeat(serviceName: string, status: ServiceState['status'] = 'online'): void {
    this.dispatch('SERVICE_HEARTBEAT', { name: serviceName, status }, serviceName);
  }

  setActiveProject(projectId: string): void {
    this.dispatch('PROJECT_ACTIVATED', { projectId }, 'user');
  }

  setActiveTask(taskId: string): void {
    this.dispatch('TASK_ACTIVATED', { taskId }, 'user');
  }

  sync(): void {
    this.dispatch('CONTEXT_SYNCED', { version: this.version }, 'system');
  }

  // Query methods for deterministic state access
  isServiceOnline(name: string): boolean {
    const service = this.state.services.find(s => s.name === name);
    return service?.status === 'online';
  }

  getServiceState(name: string): ServiceState | undefined {
    return this.state.services.find(s => s.name === name);
  }

  toJSON(): object {
    return {
      state: this.state,
      version: this.version,
      eventCount: this.events.length,
    };
  }
}

// Singleton instance for global access
let globalStore: DeterministicStateStore | null = null;

export function getContextStore(): DeterministicStateStore {
  if (!globalStore) {
    globalStore = new DeterministicStateStore();
  }
  return globalStore;
}

export function resetContextStore(): void {
  globalStore = null;
}
