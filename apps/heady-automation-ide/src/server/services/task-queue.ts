/**
 * Task queue for managing MCP service requests
 * Prevents overwhelming services with concurrent requests
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { Task, TaskResult } from './task-router.js';

interface QueuedTask {
  id: string;
  task: Task;
  priority: number;
  addedAt: number;
  resolve: (result: TaskResult) => void;
  reject: (error: Error) => void;
}

export class TaskQueue extends EventEmitter {
  private queue: QueuedTask[] = [];
  private processing = new Map<string, QueuedTask>();
  private maxConcurrent: number;
  private taskIdCounter = 0;

  constructor(maxConcurrent = 3) {
    super();
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add a task to the queue
   */
  async enqueue(task: Task, priority = 0, existingId?: string): Promise<TaskResult> {
    const taskId = existingId || `task_${++this.taskIdCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const queuedTask: QueuedTask = {
        id: taskId,
        task,
        priority,
        addedAt: Date.now(),
        resolve,
        reject,
      };

      this.queue.push(queuedTask);
      this.sortQueue();

      logger.info('Task enqueued', {
        taskId,
        taskType: task.type,
        queueLength: this.queue.length,
        priority,
      });

      this.emit('enqueued', queuedTask);
      this.processNext();
    });
  }

  /**
   * Process the next task in the queue
   */
  private async processNext(): Promise<void> {
    if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const queuedTask = this.queue.shift();
    if (!queuedTask) return;

    this.processing.set(queuedTask.id, queuedTask);

    logger.info('Task processing started', {
      taskId: queuedTask.id,
      taskType: queuedTask.task.type,
      waitTime: Date.now() - queuedTask.addedAt,
      concurrent: this.processing.size,
    });

    this.emit('processing', queuedTask);

    try {
      // Import task router dynamically to avoid circular dependency
      const { taskRouter } = await import('./task-router.js');
      const result = await taskRouter.executeTask(queuedTask.task);

      logger.info('Task completed', {
        taskId: queuedTask.id,
        success: result.success,
        executionTime: result.executionTime,
      });

      queuedTask.resolve(result);
      this.emit('completed', queuedTask, result);
    } catch (error) {
      logger.error('Task failed', {
        taskId: queuedTask.id,
        taskType: queuedTask.task.type,
      }, error as Error);

      queuedTask.reject(error as Error);
      this.emit('failed', queuedTask, error);
    } finally {
      this.processing.delete(queuedTask.id);
      
      // Process next task
      setImmediate(() => this.processNext());
    }
  }

  /**
   * Sort queue by priority (higher priority first)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.addedAt - b.addedAt;
    });
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number;
    processing: number;
    maxConcurrent: number;
    tasks: Array<{ id: string; type: string; priority: number; waitTime: number }>;
  } {
    const now = Date.now();
    return {
      queueLength: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      tasks: this.queue.map((t) => ({
        id: t.id,
        type: t.task.type,
        priority: t.priority,
        waitTime: now - t.addedAt,
      })),
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    const cleared = this.queue.length;
    this.queue.forEach((task) => {
      task.reject(new Error('Queue cleared'));
    });
    this.queue = [];

    logger.info('Queue cleared', { clearedTasks: cleared });
  }

  /**
   * Set maximum concurrent tasks
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
    logger.info('Max concurrent tasks updated', { maxConcurrent: max });
    
    // Process any pending tasks
    this.processNext();
  }
}

// Singleton instance
export const taskQueue = new TaskQueue(3);
