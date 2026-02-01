import { TaskManager, Task, TaskEvent, TaskMetrics } from '@heady/task-manager';
import { logger } from '../utils/logger.js';
import { mcpManager } from './mcp-manager.js';
import { getGistManager } from './gist-manager.js';
import { chromium } from 'playwright';
import { Server } from 'socket.io';

// Configuration for the persistent task manager
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const DB_USER = process.env.POSTGRES_USER || 'heady';
const DB_PASS = process.env.POSTGRES_PASSWORD || 'password';
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.POSTGRES_PORT || '5432';
const DB_NAME = process.env.POSTGRES_DB || 'headysystems_dev';

const DATABASE_URL = process.env.DATABASE_URL || `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

class PersistentTaskManagerService {
  private taskManager: TaskManager | null = null;
  private io: Server | null = null;

  async initialize(io: Server) {
    if (this.taskManager) return;
    this.io = io;

    logger.info('Initializing Persistent Task Manager...');

    try {
      this.taskManager = new TaskManager({
        queue: {
          redis: {
            host: REDIS_HOST,
            port: REDIS_PORT,
            password: REDIS_PASSWORD,
          },
          concurrency: parseInt(process.env.HC_QUEUE_MAX_CONCURRENT || '5'),
          maxRetries: 3,
          retryDelay: 5000,
        },
        database: {
          connectionString: DATABASE_URL,
        },
        monitoring: {
          enabled: process.env.HC_MONITORING_ENABLED !== 'false',
          interval: parseInt(process.env.HC_MONITORING_INTERVAL_MS || '5000'),
        },
      });

      // Register Executors
      this.registerExecutors();

      // Setup Event Bridging
      this.setupEventBridging();

      // Start the manager
      await this.taskManager.initialize();
      await this.taskManager.start();

      logger.info('Persistent Task Manager initialized and started');
    } catch (error) {
      logger.error('Failed to initialize Persistent Task Manager', { error });
      throw error;
    }
  }

  private registerExecutors() {
    if (!this.taskManager) return;

    // Generic MCP Task Executor
    this.taskManager.registerExecutor({
      type: 'mcp-task',
      execute: async (payload: any, task: any, context?: any) => {
        const { service, method, params } = payload;
        
        // Report progress
        if (context?.updateProgress) context.updateProgress(10);

        logger.info(`Executing MCP task: ${task.id} -> ${service}.${method}`);

        try {
            const result = await mcpManager.executeTask(service, method, params);
            if (context?.updateProgress) context.updateProgress(100);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`MCP task execution failed: ${task.id} - ${errorMessage}`);
            throw error;
        }
      }
    });

    // Browser Automation Executor
    this.taskManager.registerExecutor({
      type: 'browser_automation',
      execute: async (payload: any, task: any, context?: any) => {
        const { url, action, selector, value, interactive } = payload;
        
        if (context?.updateProgress) context.updateProgress(10);
        logger.info(`Executing Browser task: ${action} on ${url}`);

        if (action === 'screenshot') {
          const browser = await chromium.launch({ 
            headless: !interactive,
            slowMo: interactive ? 500 : 0
          });
          
          if (context?.updateProgress) context.updateProgress(30);
          
          try {
            const page = await browser.newPage();
            await page.goto(url);
            
            if (context?.updateProgress) context.updateProgress(70);
            
            const buffer = await page.screenshot();
            const screenshot = buffer.toString('base64');
            await browser.close();
            
            if (context?.updateProgress) context.updateProgress(100);
            return { screenshot: `data:image/png;base64,${screenshot}` };
          } catch (error) {
            await browser.close();
            throw error;
          }
        }
        
        throw new Error(`Unknown browser action: ${action}`);
      }
    });

    // Gist Management Executor
    this.taskManager.registerExecutor({
      type: 'snippet_management',
      execute: async (payload: any, task: any, context?: any) => {
        const { action, ...args } = payload;
        const gistManager = getGistManager();
        
        if (context?.updateProgress) context.updateProgress(50);

        if (action === 'create') {
            const result = await gistManager.createGist(args.description, args.files, args.isPublic);
            if (context?.updateProgress) context.updateProgress(100);
            return result;
        } else if (action === 'get') {
            const result = await gistManager.getGist(args.id);
            if (context?.updateProgress) context.updateProgress(100);
            return result;
        }
        
        throw new Error(`Unknown gist action: ${action}`);
      }
    });

    // Code Generation Executor
    this.taskManager.registerExecutor({
        type: 'code_generation',
        execute: async (payload: any, task: any, context?: any) => {
            if (context?.updateProgress) context.updateProgress(10);
            // Route to Jules or similar MCP
            const result = await mcpManager.executeTask('jules', 'generate_code', payload);
            if (context?.updateProgress) context.updateProgress(100);
            return result;
        }
    });
  }

  private setupEventBridging() {
    if (!this.taskManager || !this.io) return;

    const manager = this.taskManager;
    const io = this.io;

    // Bridge TaskManager events to Socket.IO
    manager.on('task:created', (task: Task) => {
        io.emit('task:created', this.formatTaskForClient(task));
    });

    manager.on('task:queued', (event: TaskEvent) => {
        io.to(`task:${event.taskId}`).emit('task:status', { 
            taskId: event.taskId, 
            status: 'queued',
            execution: this.formatEventForClient(event, 'queued')
        });
        io.emit('task:status', { 
            taskId: event.taskId, 
            status: 'queued',
            execution: this.formatEventForClient(event, 'queued')
        });
    });

    manager.on('task:started', (event: TaskEvent) => {
         const data = { 
            taskId: event.taskId, 
            status: 'running',
            execution: this.formatEventForClient(event, 'running')
        };
        io.to(`task:${event.taskId}`).emit('task:status', data);
        io.emit('task:status', data);
    });

    manager.on('task:progress', (event: TaskEvent) => {
        const data = { 
            taskId: event.taskId, 
            progress: event.data.progress, 
            message: event.data.message,
            execution: this.formatEventForClient(event, 'running', event.data.progress)
        };
        io.to(`task:${event.taskId}`).emit('task:progress', data);
        io.emit('task:progress', data);
    });

    manager.on('task:completed', (event: TaskEvent) => {
        const data = { 
            taskId: event.taskId, 
            status: 'completed',
            result: event.data,
            execution: this.formatEventForClient(event, 'completed', 100)
        };
        io.to(`task:${event.taskId}`).emit('task:status', data);
        io.emit('task:status', data);
    });

    manager.on('task:failed', (event: TaskEvent) => {
        const data = { 
            taskId: event.taskId, 
            status: 'failed',
            error: event.data,
            execution: this.formatEventForClient(event, 'failed')
        };
        io.to(`task:${event.taskId}`).emit('task:status', data);
        io.emit('task:status', data);
    });
    
    manager.on('task:cancelled', (event: TaskEvent) => {
        const data = { 
            taskId: event.taskId, 
            status: 'cancelled',
            execution: this.formatEventForClient(event, 'cancelled')
        };
        io.to(`task:${event.taskId}`).emit('task:status', data);
        io.emit('task:status', data);
    });

    manager.on('metrics:update', (metrics: TaskMetrics) => {
        io.emit('task:metrics', {
            timestamp: Date.now(),
            taskMetrics: metrics
        });
    });
  }

  // Helper to shape data for the existing frontend
  private formatTaskForClient(task: Task) {
      return {
          id: task.id,
          task: {
              type: task.type,
              description: task.description || task.name,
              priority: task.priority
          },
          status: task.status.toLowerCase(),
          progress: task.progress || 0,
          startedAt: task.startedAt ? new Date(task.startedAt).getTime() : undefined,
          executionTime: undefined // calculated on client or from completed event
      };
  }

  private formatEventForClient(event: TaskEvent, status: string, progress?: number) {
      // This is an approximation to match the TaskExecution interface expected by frontend
      return {
          id: event.taskId,
          status: status,
          progress: progress !== undefined ? progress : (status === 'completed' ? 100 : 0),
          // We might not have the full task details in every event, 
          // but the frontend often merges this into existing state.
          // If needed, we could fetch the task from repo, but that's expensive for every event.
      };
  }

  getManager() {
      if (!this.taskManager) throw new Error('PersistentTaskManager not initialized');
      return this.taskManager;
  }

  async stop() {
      if (this.taskManager) {
          await this.taskManager.stop();
      }
  }
}

export const persistentTaskManager = new PersistentTaskManagerService();
