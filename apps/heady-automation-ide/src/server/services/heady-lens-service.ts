
import { EventEmitter } from 'events';
import { mcpManager } from './mcp-manager.js';
import { monitoringService } from './monitoring-service.js';
import { persistentTaskManager } from './persistent-task-manager.js';
// import { getContextStore } from '@heady/core-domain'; // Removed until core-domain is built
import { logger } from '../utils/logger.js';

export interface SystemComponent {
  id: string;
  type: 'service' | 'database' | 'queue' | 'interface' | 'variable';
  name: string;
  status: 'active' | 'inactive' | 'error' | 'unknown';
  dependencies: string[];
  metadata: Record<string, any>;
}

export interface SystemSnapshot {
  timestamp: number;
  components: SystemComponent[];
  variables: Record<string, any>;
  constants: Record<string, any>;
  relations: { source: string; target: string; type: string }[];
}

export class HeadyLensService extends EventEmitter {
  private static instance: HeadyLensService;
  private snapshotInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    super();
  }

  static getInstance(): HeadyLensService {
    if (!HeadyLensService.instance) {
      HeadyLensService.instance = new HeadyLensService();
    }
    return HeadyLensService.instance;
  }

  startLens(intervalMs: number = 2000) {
    if (this.snapshotInterval) return;
    
    logger.info('HeadyLens Monitoring Started');
    this.snapshotInterval = setInterval(async () => {
      const snapshot = await this.captureSnapshot();
      this.emit('snapshot', snapshot);
    }, intervalMs);
  }

  stopLens() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }

  async captureSnapshot(): Promise<SystemSnapshot> {
    const components: SystemComponent[] = [];
    const relations: { source: string; target: string; type: string }[] = [];
    const variables: Record<string, any> = {};

    // 1. Capture MCP Services
    const mcpServices = mcpManager.getRunningServices();
    mcpServices.forEach(serviceName => {
      const id = `service:${serviceName}`;
      components.push({
        id,
        type: 'service',
        name: serviceName,
        status: 'active',
        dependencies: [],
        metadata: { name: serviceName, running: true }
      });
    });

    // 2. Capture Task Manager State
    const queueStatus = await persistentTaskManager.getManager().getQueueStatus();
    components.push({
      id: 'system:task-queue',
      type: 'queue',
      name: 'Task Queue',
      status: queueStatus.active > 0 ? 'active' : 'inactive',
      dependencies: ['service:redis', 'service:postgres'],
      metadata: queueStatus
    });
    
    relations.push({ source: 'system:task-queue', target: 'service:redis', type: 'depends_on' });
    relations.push({ source: 'system:task-queue', target: 'service:postgres', type: 'depends_on' });

    // 3. Capture Monitoring State
    const health = monitoringService.getServiceStatuses();
    health.forEach(s => {
      // Correlate with MCP services or add new
      const id = `service:${s.name}`;
      const existing = components.find(c => c.id === id);
      if (existing) {
        existing.status = s.status === 'healthy' ? 'active' : 'error';
        existing.metadata.health = s;
      } else {
        components.push({
          id,
          type: 'service',
          name: s.name,
          status: s.status === 'healthy' ? 'active' : 'error',
          dependencies: [],
          metadata: { health: s }
        });
      }
    });

    // 4. Introspect Environment Variables (Sanitized)
    const envVars = [
      'NODE_ENV', 'PORT', 'HC_MONITORING_ENABLED', 
      'HC_AUTOMATION_ALLOWED_ORIGINS', 'LOG_LEVEL'
    ];
    
    envVars.forEach(key => {
      if (process.env[key]) {
        variables[key] = process.env[key];
        components.push({
          id: `var:${key}`,
          type: 'variable',
          name: key,
          status: 'active',
          dependencies: [],
          metadata: { value: process.env[key] }
        });
        
        // Link variable to system
        relations.push({ source: 'system:core', target: `var:${key}`, type: 'configured_by' });
      }
    });

    // 5. Constants & Configuration
    const constants = {
      MAX_HISTORY: 1000,
      DEFAULT_TIMEOUT: 5000,
      SACRED_RATIO: 1.61803398875,
      INFRA_MODE: persistentTaskManager.getMode()
    };

    return {
      timestamp: Date.now(),
      components,
      variables,
      constants,
      relations
    };
  }
}

export const headyLens = HeadyLensService.getInstance();
