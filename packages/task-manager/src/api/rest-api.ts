import express, { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Task, TaskStatus, TaskPriority } from '../types/task.types.js';
import { TaskQueue } from '../core/task-queue.js';
import { TaskRepository } from '../persistence/task-repository.js';
import { logger } from '../utils/logger.js';

const CreateTaskSchema = z.object({
  type: z.string(),
  name: z.string(),
  description: z.string().optional(),
  payload: z.any(),
  priority: z.nativeEnum(TaskPriority).optional(),
  scheduledFor: z.string().datetime().optional(),
  parentTaskId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateTaskSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  progress: z.number().min(0).max(100).optional(),
  result: z.any().optional(),
  error: z.string().optional(),
});

export class TaskRestAPI {
  private router: Router;

  constructor(
    private taskQueue: TaskQueue,
    private taskRepository: TaskRepository
  ) {
    this.router = express.Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Middleware
    this.router.use(express.json());

    // Create a new task
    this.router.post('/tasks', this.asyncHandler(this.createTask.bind(this)));

    // Get task by ID
    this.router.get('/tasks/:id', this.asyncHandler(this.getTask.bind(this)));

    // Update task
    this.router.patch('/tasks/:id', this.asyncHandler(this.updateTask.bind(this)));

    // Cancel task
    this.router.delete('/tasks/:id', this.asyncHandler(this.cancelTask.bind(this)));

    // Retry task
    this.router.post('/tasks/:id/retry', this.asyncHandler(this.retryTask.bind(this)));

    // List tasks
    this.router.get('/tasks', this.asyncHandler(this.listTasks.bind(this)));

    // Get task children
    this.router.get('/tasks/:id/children', this.asyncHandler(this.getTaskChildren.bind(this)));

    // Get queue status
    this.router.get('/queue/status', this.asyncHandler(this.getQueueStatus.bind(this)));

    // Get metrics
    this.router.get('/metrics', this.asyncHandler(this.getMetrics.bind(this)));

    // Get statistics
    this.router.get('/stats', this.asyncHandler(this.getStats.bind(this)));

    // Health check
    this.router.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  private async createTask(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateTaskSchema.parse(req.body);
      const taskId = await this.taskQueue.enqueue({
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      });

      const task = await this.taskRepository.findById(taskId);
      res.status(201).json({ success: true, task });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        });
      } else {
        throw error;
      }
    }
  }

  private async getTask(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const task = await this.taskRepository.findById(id);
    
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
    
    res.json({ success: true, task });
  }

  private async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = UpdateTaskSchema.parse(req.body);
      
      const task = await this.taskRepository.findById(id);
      if (!task) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      if (data.status) {
        await this.taskRepository.updateStatus(id, data.status);
      }
      
      if (data.progress !== undefined) {
        await this.taskRepository.updateProgress(id, data.progress);
      }

      const updatedTask = await this.taskRepository.findById(id);
      res.json({ success: true, task: updatedTask });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        });
      } else {
        throw error;
      }
    }
  }

  private async cancelTask(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const cancelled = await this.taskQueue.cancelTask(id);
    
    if (!cancelled) {
      res.status(404).json({ success: false, error: 'Task not found or cannot be cancelled' });
      return;
    }
    
    await this.taskRepository.updateStatus(id, TaskStatus.CANCELLED);
    res.json({ success: true, message: 'Task cancelled' });
  }

  private async retryTask(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const retried = await this.taskQueue.retryTask(id);
    
    if (!retried) {
      res.status(404).json({ success: false, error: 'Task not found or cannot be retried' });
      return;
    }
    
    res.json({ success: true, message: 'Task queued for retry' });
  }

  private async listTasks(req: Request, res: Response): Promise<void> {
    const { status, type, limit = '20' } = req.query;
    
    let tasks: Task[];
    
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      tasks = await this.taskRepository.findByStatus(status as TaskStatus);
    } else if (type) {
      tasks = await this.taskRepository.findByType(type as string);
    } else {
      tasks = await this.taskRepository.getRecentTasks(parseInt(limit as string));
    }
    
    res.json({ success: true, tasks, count: tasks.length });
  }

  private async getTaskChildren(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const children = await this.taskRepository.findByParentId(id);
    res.json({ success: true, tasks: children, count: children.length });
  }

  private async getQueueStatus(req: Request, res: Response): Promise<void> {
    const status = await this.taskQueue.getStatus();
    res.json({ success: true, status });
  }

  private async getMetrics(req: Request, res: Response): Promise<void> {
    const metrics = await this.taskQueue.getMetrics();
    res.json({ success: true, metrics });
  }

  private async getStats(req: Request, res: Response): Promise<void> {
    const stats = await this.taskRepository.getStats();
    res.json({ success: true, stats });
  }

  private asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  getRouter(): Router {
    return this.router;
  }
}
