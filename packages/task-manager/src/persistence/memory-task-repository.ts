
import { Task, TaskStatus } from '../types/task.types.js';
import { logger } from '../utils/logger.js';

export class MemoryTaskRepository {
  private tasks: Map<string, Task> = new Map();

  async initialize(): Promise<void> {
    logger.info('Memory Task Repository initialized');
  }

  async save(task: Task): Promise<Task> {
    this.tasks.set(task.id, { ...task });
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.status === status)
      .sort((a, b) => (a.priority - b.priority) || (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }

  async findByType(type: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findByParentId(parentId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.parentTaskId === parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
      this.tasks.set(id, task);
    }
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.progress = progress;
      this.tasks.set(id, task);
    }
  }

  async markStarted(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.status = TaskStatus.RUNNING;
      task.startedAt = new Date();
      this.tasks.set(id, task);
    }
  }

  async markCompleted(id: string, result?: any): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.progress = 100;
      if (result) task.result = result;
      this.tasks.set(id, task);
    }
  }

  async markFailed(id: string, error: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.status = TaskStatus.FAILED;
      task.completedAt = new Date();
      task.error = error;
      this.tasks.set(id, task);
    }
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byType: Record<string, number>;
  }> {
    const total = this.tasks.size;
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const task of this.tasks.values()) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byType[task.type] = (byType[task.type] || 0) + 1;
    }

    return {
      total,
      byStatus: byStatus as Record<TaskStatus, number>,
      byType,
    };
  }

  async getRecentTasks(limit: number = 10): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async cleanup(olderThan: Date): Promise<number> {
    let count = 0;
    for (const [id, task] of this.tasks.entries()) {
      if (task.completedAt && new Date(task.completedAt) < olderThan && 
         (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED || task.status === TaskStatus.CANCELLED)) {
        this.tasks.delete(id);
        count++;
      }
    }
    return count;
  }

  async close(): Promise<void> {
    // No-op for memory
    logger.info('Memory Task Repository closed');
  }
}
