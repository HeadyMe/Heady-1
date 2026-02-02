
import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority, TaskEvent } from '../types/task.types.js';
import { logger } from '../utils/logger.js';

export class MemoryTaskQueue extends EventEmitter {
  private queue: Task[] = [];
  private active: Task[] = [];
  private completed: Task[] = [];
  private failed: Task[] = [];
  private executors: Map<string, Function> = new Map();
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private concurrency: number;

  constructor(private name: string, config: { concurrency: number }) {
    super();
    this.concurrency = config.concurrency;
  }

  registerExecutor(type: string, executor: Function): void {
    this.executors.set(type, executor);
    logger.info(`[MemoryQueue] Registered executor for task type: ${type}`);
  }

  async enqueue(task: Partial<Task>): Promise<string> {
    const taskId = task.id || uuidv4();
    const taskData: Task = {
      ...task,
      id: taskId,
      status: TaskStatus.QUEUED,
      createdAt: new Date(),
      attempts: 0,
    } as Task; // Casting as we trust Partial<Task> to have enough info or defaults

    // Insert based on priority
    const priority = task.priority || TaskPriority.NORMAL;
    const index = this.queue.findIndex(t => (t.priority || 0) < priority);
    
    if (index === -1) {
      this.queue.push(taskData);
    } else {
      this.queue.splice(index, 0, taskData);
    }

    this.emit('task:created', { 
      taskId, 
      event: 'created',
      timestamp: new Date(),
      data: taskData 
    });
    
    this.emit('task:queued', { taskId, event: 'queued' });
    logger.info(`[MemoryQueue] Task ${taskId} enqueued`, { type: task.type, priority });
    
    return taskId;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(`[MemoryQueue] Started with concurrency: ${this.concurrency}`);
    
    this.interval = setInterval(() => this.processQueue(), 100);
  }

  private async processQueue() {
    if (this.active.length >= this.concurrency) return;
    if (this.queue.length === 0) return;

    const task = this.queue.shift();
    if (!task) return;

    this.active.push(task);
    
    // Process asynchronously
    this.processTask(task).catch(err => {
      logger.error(`[MemoryQueue] Unhandled error processing task ${task.id}`, err);
    });
  }

  private async processTask(task: Task) {
    const executor = this.executors.get(task.type);
    
    this.emit('task:started', { taskId: task.id, event: 'started' });
    logger.info(`[MemoryQueue] Executing task ${task.id}`, { type: task.type });

    if (!executor) {
      const error = `No executor registered for task type: ${task.type}`;
      logger.error(error);
      this.failTask(task, error);
      return;
    }

    try {
      const result = await executor(task.payload, task, {
        updateProgress: (progress: number) => {
          this.emit('task:progress', { 
            taskId: task.id, 
            event: 'progress', 
            data: { progress } 
          });
        },
      });
      this.completeTask(task, result);
    } catch (error) {
      logger.error(`[MemoryQueue] Task ${task.id} failed`, error);
      this.failTask(task, error);
    }
  }

  private completeTask(task: Task, result: any) {
    this.active = this.active.filter(t => t.id !== task.id);
    this.completed.push({ ...task, status: TaskStatus.COMPLETED, result, completedAt: new Date() });
    this.emit('task:completed', { taskId: task.id, event: 'completed', data: result });
  }

  private failTask(task: Task, error: any) {
    this.active = this.active.filter(t => t.id !== task.id);
    this.failed.push({ ...task, status: TaskStatus.FAILED, error: String(error), completedAt: new Date() });
    this.emit('task:failed', { taskId: task.id, event: 'failed', data: error });
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    logger.info('[MemoryQueue] Stopped');
  }

  async getTask(taskId: string): Promise<any | null> {
    return this.queue.find(t => t.id === taskId) || 
           this.active.find(t => t.id === taskId) || 
           this.completed.find(t => t.id === taskId) ||
           this.failed.find(t => t.id === taskId);
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const queueIndex = this.queue.findIndex(t => t.id === taskId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      this.emit('task:cancelled', { taskId, event: 'cancelled', timestamp: new Date() });
      return true;
    }
    // Cannot easily cancel active task in this simple impl without AbortController
    return false;
  }

  async retryTask(taskId: string): Promise<boolean> {
    const task = this.failed.find(t => t.id === taskId);
    if (!task) return false;

    this.failed = this.failed.filter(t => t.id !== taskId);
    this.enqueue(task);
    this.emit('task:retried', { taskId, event: 'retried', timestamp: new Date() });
    return true;
  }

  async getStatus() {
    return {
      waiting: this.queue.length,
      active: this.active.length,
      completed: this.completed.length,
      failed: this.failed.length,
      delayed: 0,
      paused: 0
    };
  }

  async getMetrics() {
    return {
      throughput: 0, // Not implemented in memory mock
      errorRate: this.failed.length / (this.completed.length + this.failed.length) || 0,
      avgWaitTime: 0,
      avgProcessTime: 0,
    };
  }

  async clearCompleted(): Promise<void> {
    this.completed = [];
  }

  async clearFailed(): Promise<void> {
    this.failed = [];
  }
}
