import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskExecutor, TaskEvent } from '../types/task.types.js';
import { TaskQueue, QueueConfig } from './task-queue.js';
import { TaskRepository } from '../persistence/task-repository.js';
import { TaskWebSocketServer } from './websocket-server.js';
import { logger } from '../utils/logger.js';
import { MetricsCollector } from '../monitoring/metrics-collector.js';

export interface TaskManagerConfig {
  queue: QueueConfig;
  database: {
    connectionString: string;
  };
  monitoring?: {
    enabled: boolean;
    interval: number;
  };
  maxConcurrentTasks?: number;
  deterministicSeed?: string;
}

export class TaskManager extends EventEmitter {
  private taskQueue: TaskQueue;
  private taskRepository: TaskRepository;
  private websocketServer?: TaskWebSocketServer;
  private metricsCollector?: MetricsCollector;
  private executors: Map<string, TaskExecutor> = new Map();
  private isRunning: boolean = false;
  private metricsInterval?: NodeJS.Timeout;

  constructor(private config: TaskManagerConfig) {
    super();
    
    this.taskQueue = new TaskQueue('main-queue', config.queue);
    this.taskRepository = new TaskRepository(config.database.connectionString);
    
    if (config.monitoring?.enabled) {
      this.metricsCollector = new MetricsCollector();
    }
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Forward queue events
    this.taskQueue.on('task:created', async (event: TaskEvent) => {
      await this.handleTaskCreated(event);
    });

    this.taskQueue.on('task:queued', async (event: TaskEvent) => {
      await this.handleTaskQueued(event);
    });

    this.taskQueue.on('task:started', async (event: TaskEvent) => {
      await this.handleTaskStarted(event);
    });

    this.taskQueue.on('task:progress', async (event: TaskEvent) => {
      await this.handleTaskProgress(event);
    });

    this.taskQueue.on('task:completed', async (event: TaskEvent) => {
      await this.handleTaskCompleted(event);
    });

    this.taskQueue.on('task:failed', async (event: TaskEvent) => {
      await this.handleTaskFailed(event);
    });

    this.taskQueue.on('task:cancelled', async (event: TaskEvent) => {
      await this.handleTaskCancelled(event);
    });
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Task Manager...');
    
    // Initialize database
    await this.taskRepository.initialize();
    
    // Register built-in executors
    this.registerBuiltInExecutors();
    
    // Start metrics collection
    if (this.metricsCollector && this.config.monitoring?.enabled) {
      this.startMetricsCollection();
    }
    
    logger.info('Task Manager initialized');
  }

  private registerBuiltInExecutors(): void {
    // Register a default executor for testing
    this.registerExecutor({
      type: 'echo',
      async execute(payload: any) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { echo: payload };
      }
    });

    // Register a batch processing executor
    this.registerExecutor({
      type: 'batch',
      async execute(payload: any[], task: Task) {
        const results = [];
        for (let i = 0; i < payload.length; i++) {
          results.push(await (this as any).processBatchItem(payload[i]));
          const progress = ((i + 1) / payload.length) * 100;
          task.progress = progress;
        }
        return results;
      },
      async processBatchItem(item: any) {
        // Process individual item
        return item;
      }
    } as any);
  }

  registerExecutor(executor: TaskExecutor): void {
    this.executors.set(executor.type, executor);
    
    // Register with queue
    this.taskQueue.registerExecutor(executor.type, async (payload: any, task: Task, context: any) => {
      // Validate payload if validator provided
      if (executor.validate) {
        const isValid = await executor.validate(payload);
        if (!isValid) {
          throw new Error('Payload validation failed');
        }
      }
      
      // Execute task with progress callback
      const result = await executor.execute(payload, task);
      
      // Handle progress updates
      if (executor.onProgress && context.updateProgress) {
        executor.onProgress = (progress: number) => {
          context.updateProgress(progress);
        };
      }
      
      return result;
    });
    
    logger.info(`Registered executor for type: ${executor.type}`);
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      type: taskData.type || 'default',
      name: taskData.name || 'Unnamed Task',
      description: taskData.description,
      payload: taskData.payload || {},
      status: TaskStatus.PENDING,
      priority: taskData.priority || 3,
      attempts: 0,
      maxRetries: taskData.maxRetries || 3,
      progress: 0,
      createdAt: new Date(),
      scheduledFor: taskData.scheduledFor,
      metadata: taskData.metadata || {},
      parentTaskId: taskData.parentTaskId,
      childTaskIds: taskData.childTaskIds || [],
    };

    // Save to database
    const savedTask = await this.taskRepository.save(task);
    
    // Queue the task
    await this.taskQueue.enqueue(savedTask);
    
    // Emit event
    this.emit('task:created', savedTask);
    
    // Send WebSocket notification
    if (this.websocketServer) {
      this.websocketServer.emitTaskCreated(savedTask);
    }
    
    logger.info(`Task created: ${savedTask.id} (${savedTask.type})`);
    return savedTask;
  }

  async createChildTask(parentId: string, taskData: Partial<Task>): Promise<Task> {
    const parent = await this.taskRepository.findById(parentId);
    if (!parent) {
      throw new Error(`Parent task not found: ${parentId}`);
    }
    
    const childTask = await this.createTask({
      ...taskData,
      parentTaskId: parentId,
    });
    
    // Update parent's child task list
    if (!parent.childTaskIds) {
      parent.childTaskIds = [];
    }
    parent.childTaskIds.push(childTask.id);
    await this.taskRepository.save(parent);
    
    return childTask;
  }

  async getTask(taskId: string): Promise<Task | null> {
    return this.taskRepository.findById(taskId);
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const success = await this.taskQueue.cancelTask(taskId);
    if (success) {
      await this.taskRepository.updateStatus(taskId, TaskStatus.CANCELLED);
    }
    return success;
  }

  async retryTask(taskId: string): Promise<boolean> {
    return this.taskQueue.retryTask(taskId);
  }

  // Event handlers
  private async handleTaskCreated(event: TaskEvent): Promise<void> {
    if (this.metricsCollector) {
      this.metricsCollector.recordTaskCreated(event.data?.type);
    }
  }

  private async handleTaskQueued(event: TaskEvent): Promise<void> {
    await this.taskRepository.updateStatus(event.taskId, TaskStatus.QUEUED);
    
    this.emit('task:queued', event);

    if (this.websocketServer) {
      this.websocketServer.emitTaskEvent(event);
    }
  }

  private async handleTaskStarted(event: TaskEvent): Promise<void> {
    await this.taskRepository.markStarted(event.taskId);
    
    this.emit('task:started', event);

    if (this.websocketServer) {
      this.websocketServer.emitTaskStarted(event.taskId);
    }
    
    if (this.metricsCollector) {
      this.metricsCollector.recordTaskStarted(event.taskId);
    }
  }

  private async handleTaskProgress(event: TaskEvent): Promise<void> {
    const progress = event.data?.progress || 0;
    await this.taskRepository.updateProgress(event.taskId, progress);
    
    this.emit('task:progress', event);

    if (this.websocketServer) {
      this.websocketServer.emitTaskProgress(event.taskId, progress);
    }
  }

  private async handleTaskCompleted(event: TaskEvent): Promise<void> {
    await this.taskRepository.markCompleted(event.taskId, event.data);
    
    this.emit('task:completed', event);

    if (this.websocketServer) {
      this.websocketServer.emitTaskCompleted(event.taskId, event.data);
    }
    
    if (this.metricsCollector) {
      const task = await this.taskRepository.findById(event.taskId);
      if (task) {
        this.metricsCollector.recordTaskCompleted(
          event.taskId,
          task.type,
          task.startedAt ? Date.now() - task.startedAt.getTime() : 0
        );
      }
    }
  }

  private async handleTaskFailed(event: TaskEvent): Promise<void> {
    const error = event.data || 'Unknown error';
    await this.taskRepository.markFailed(event.taskId, error);
    
    this.emit('task:failed', event);

    if (this.websocketServer) {
      this.websocketServer.emitTaskFailed(event.taskId, error);
    }
    
    if (this.metricsCollector) {
      const task = await this.taskRepository.findById(event.taskId);
      if (task) {
        this.metricsCollector.recordTaskFailed(event.taskId, task.type, error);
      }
    }
  }

  private async handleTaskCancelled(event: TaskEvent): Promise<void> {
    await this.taskRepository.updateStatus(event.taskId, TaskStatus.CANCELLED);
    
    this.emit('task:cancelled', event);

    if (this.websocketServer) {
      this.websocketServer.emitTaskEvent(event);
    }
  }

  private startMetricsCollection(): void {
    if (!this.metricsCollector) return;
    
    const interval = this.config.monitoring?.interval || 10000; // 10 seconds default
    
    this.metricsInterval = setInterval(async () => {
      const queueStatus = await this.taskQueue.getStatus();
      const queueMetrics = await this.taskQueue.getMetrics();
      const dbStats = await this.taskRepository.getStats();
      
      const metrics = {
        ...queueStatus,
        ...queueMetrics,
        ...dbStats,
        timestamp: new Date(),
      };
      
      if (this.websocketServer) {
        this.websocketServer.emitMetrics(metrics as any);
      }
      
      this.emit('metrics:update', metrics);
    }, interval);
  }

  attachWebSocketServer(wsServer: TaskWebSocketServer): void {
    this.websocketServer = wsServer;
    logger.info('WebSocket server attached');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Task Manager already running');
      return;
    }
    
    await this.taskQueue.start();
    this.isRunning = true;
    
    logger.info('Task Manager started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Task Manager not running');
      return;
    }
    
    // Stop metrics collection
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Stop queue
    await this.taskQueue.stop();
    
    // Close database
    await this.taskRepository.close();
    
    // Close WebSocket server if attached
    if (this.websocketServer) {
      await this.websocketServer.close();
    }
    
    this.isRunning = false;
    logger.info('Task Manager stopped');
  }

  async getQueueStatus() {
    return this.taskQueue.getStatus();
  }

  async getMetrics() {
    const queueMetrics = await this.taskQueue.getMetrics();
    const dbStats = await this.taskRepository.getStats();
    
    return {
      queue: queueMetrics,
      database: dbStats,
      websocket: this.websocketServer ? {
        connections: this.websocketServer.getConnectionsCount(),
        subscriptions: this.websocketServer.getSubscriptionsCount(),
      } : null,
    };
  }

  async getStats() {
    return this.taskRepository.getStats();
  }

  async getRecentTasks(limit: number = 50): Promise<Task[]> {
    return this.taskRepository.getRecentTasks(limit);
  }

  async cleanup(olderThan: Date): Promise<number> {
    return this.taskRepository.cleanup(olderThan);
  }

  // Alias for createTask to match SystemIntegrator expectations
  async submitTask(taskData: any): Promise<string> {
    const task = await this.createTask(taskData);
    return task.id;
  }

  // Alias for stop to match SystemIntegrator expectations
  async shutdown(): Promise<void> {
    await this.stop();
  }
}
