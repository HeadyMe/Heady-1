/**
 * Real-time Task Management System for Heady Automation IDE
 * Manages task lifecycle with WebSocket notifications and persistence
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export interface TaskDefinition {
  id: string;
  type: string;
  description: string;
  priority: TaskPriority;
  context?: any;
  assignedTo?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TaskExecution {
  id: string;
  task: TaskDefinition;
  status: TaskStatus;
  progress: number;
  result?: any;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  executionTime?: number;
  service?: string;
  logs: TaskLog[];
}

export interface TaskLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: string[];
  assignedTo?: string;
  tags?: string[];
  createdAfter?: number;
  createdBefore?: number;
}

export class RealtimeTaskManager extends EventEmitter {
  private tasks = new Map<string, TaskExecution>();
  private taskIdCounter = 0;

  /**
   * Create a new task
   */
  createTask(definition: Omit<TaskDefinition, 'id'>): TaskExecution {
    const taskId = `task_${++this.taskIdCounter}_${Date.now()}`;
    
    const task: TaskDefinition = {
      id: taskId,
      ...definition,
    };

    const execution: TaskExecution = {
      id: taskId,
      task,
      status: TaskStatus.PENDING,
      progress: 0,
      logs: [],
    };

    this.tasks.set(taskId, execution);

    logger.info('Task created', {
      taskId,
      type: task.type,
      priority: task.priority,
    });

    this.emit('task:created', execution);
    metrics.record('task_created', 1, { type: task.type });

    return execution;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): TaskExecution | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks with optional filtering
   */
  getTasks(filter?: TaskFilter): TaskExecution[] {
    let tasks = Array.from(this.tasks.values());

    if (!filter) return tasks;

    if (filter.status) {
      tasks = tasks.filter((t) => filter.status!.includes(t.status));
    }

    if (filter.priority) {
      tasks = tasks.filter((t) => filter.priority!.includes(t.task.priority));
    }

    if (filter.type) {
      tasks = tasks.filter((t) => filter.type!.includes(t.task.type));
    }

    if (filter.assignedTo) {
      tasks = tasks.filter((t) => t.task.assignedTo === filter.assignedTo);
    }

    if (filter.tags && filter.tags.length > 0) {
      tasks = tasks.filter((t) =>
        filter.tags!.some((tag) => t.task.tags?.includes(tag))
      );
    }

    if (filter.createdAfter) {
      tasks = tasks.filter((t) => {
        const createdAt = parseInt(t.id.split('_')[2]);
        return createdAt >= filter.createdAfter!;
      });
    }

    if (filter.createdBefore) {
      tasks = tasks.filter((t) => {
        const createdAt = parseInt(t.id.split('_')[2]);
        return createdAt <= filter.createdBefore!;
      });
    }

    return tasks;
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: TaskStatus, data?: any): boolean {
    const execution = this.tasks.get(taskId);
    if (!execution) return false;

    const oldStatus = execution.status;
    execution.status = status;

    if (status === TaskStatus.RUNNING && !execution.startedAt) {
      execution.startedAt = Date.now();
    }

    if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      execution.completedAt = Date.now();
      if (execution.startedAt) {
        execution.executionTime = execution.completedAt - execution.startedAt;
      }
      execution.progress = 100;
    }

    if (data) {
      if (status === TaskStatus.COMPLETED) {
        execution.result = data;
      } else if (status === TaskStatus.FAILED) {
        execution.error = data;
      }
    }

    logger.info('Task status updated', {
      taskId,
      oldStatus,
      newStatus: status,
    });

    this.emit('task:status', { taskId, status, oldStatus, execution });
    metrics.record('task_status_change', 1, { status, type: execution.task.type });

    return true;
  }

  /**
   * Update task progress
   */
  updateTaskProgress(taskId: string, progress: number, message?: string): boolean {
    const execution = this.tasks.get(taskId);
    if (!execution) return false;

    execution.progress = Math.min(100, Math.max(0, progress));

    if (message) {
      this.addTaskLog(taskId, 'info', message);
    }

    this.emit('task:progress', { taskId, progress, message, execution });

    return true;
  }

  /**
   * Add log entry to task
   */
  addTaskLog(taskId: string, level: 'info' | 'warn' | 'error', message: string, data?: any): boolean {
    const execution = this.tasks.get(taskId);
    if (!execution) return false;

    const log: TaskLog = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    execution.logs.push(log);

    // Keep only last 100 logs per task
    if (execution.logs.length > 100) {
      execution.logs.shift();
    }

    this.emit('task:log', { taskId, log, execution });

    return true;
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string, reason?: string): boolean {
    const execution = this.tasks.get(taskId);
    if (!execution) return false;

    if (execution.status === TaskStatus.COMPLETED || execution.status === TaskStatus.FAILED) {
      return false; // Can't cancel completed tasks
    }

    execution.status = TaskStatus.CANCELLED;
    execution.completedAt = Date.now();
    if (reason) {
      execution.error = reason;
    }

    logger.info('Task cancelled', { taskId, reason });

    this.emit('task:cancelled', { taskId, reason, execution });
    metrics.record('task_cancelled', 1, { type: execution.task.type });

    return true;
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): boolean {
    const execution = this.tasks.get(taskId);
    if (!execution) return false;

    this.tasks.delete(taskId);

    logger.info('Task deleted', { taskId });

    this.emit('task:deleted', { taskId });

    return true;
  }

  /**
   * Get task statistics
   */
  getStatistics(): {
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    byType: Record<string, number>;
    avgExecutionTime: number;
    successRate: number;
  } {
    const tasks = Array.from(this.tasks.values());

    const byStatus: Record<TaskStatus, number> = {
      [TaskStatus.PENDING]: 0,
      [TaskStatus.QUEUED]: 0,
      [TaskStatus.RUNNING]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.FAILED]: 0,
      [TaskStatus.CANCELLED]: 0,
    };

    const byPriority: Record<TaskPriority, number> = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.CRITICAL]: 0,
    };

    const byType: Record<string, number> = {};
    let totalExecutionTime = 0;
    let executedTasksCount = 0;

    tasks.forEach((task) => {
      byStatus[task.status]++;
      byPriority[task.task.priority]++;
      byType[task.task.type] = (byType[task.task.type] || 0) + 1;

      if (task.executionTime) {
        totalExecutionTime += task.executionTime;
        executedTasksCount++;
      }
    });

    const completedTasks = byStatus[TaskStatus.COMPLETED];
    const failedTasks = byStatus[TaskStatus.FAILED];
    const successRate =
      completedTasks + failedTasks > 0 ? completedTasks / (completedTasks + failedTasks) : 0;

    return {
      total: tasks.length,
      byStatus,
      byPriority,
      byType,
      avgExecutionTime: executedTasksCount > 0 ? totalExecutionTime / executedTasksCount : 0,
      successRate,
    };
  }

  /**
   * Get active tasks (pending, queued, or running)
   */
  getActiveTasks(): TaskExecution[] {
    return this.getTasks({
      status: [TaskStatus.PENDING, TaskStatus.QUEUED, TaskStatus.RUNNING],
    });
  }

  /**
   * Clear completed tasks older than specified time
   */
  clearOldTasks(olderThanMs: number): number {
    const cutoff = Date.now() - olderThanMs;
    let cleared = 0;

    for (const [taskId, execution] of this.tasks.entries()) {
      if (
        (execution.status === TaskStatus.COMPLETED ||
          execution.status === TaskStatus.FAILED ||
          execution.status === TaskStatus.CANCELLED) &&
        execution.completedAt &&
        execution.completedAt < cutoff
      ) {
        this.tasks.delete(taskId);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info('Old tasks cleared', { count: cleared, olderThanMs });
      this.emit('tasks:cleared', { count: cleared });
    }

    return cleared;
  }

  /**
   * Get task count
   */
  getTaskCount(): number {
    return this.tasks.size;
  }

  /**
   * Clear all tasks
   */
  clearAll(): void {
    const count = this.tasks.size;
    this.tasks.clear();
    logger.info('All tasks cleared', { count });
    this.emit('tasks:cleared', { count });
  }
}

// Singleton instance
export const realtimeTaskManager = new RealtimeTaskManager();
