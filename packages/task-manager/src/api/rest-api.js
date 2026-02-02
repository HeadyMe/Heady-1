import express from 'express';
import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../types/task.types.js';
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
    taskQueue;
    taskRepository;
    router;
    constructor(taskQueue, taskRepository) {
        this.taskQueue = taskQueue;
        this.taskRepository = taskRepository;
        this.router = express.Router();
        this.setupRoutes();
    }
    setupRoutes() {
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
    async createTask(req, res) {
        try {
            const data = CreateTaskSchema.parse(req.body);
            const taskId = await this.taskQueue.enqueue({
                ...data,
                scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
            });
            const task = await this.taskRepository.findById(taskId);
            res.status(201).json({ success: true, task });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.errors
                });
            }
            else {
                throw error;
            }
        }
    }
    async getTask(req, res) {
        const { id } = req.params;
        const task = await this.taskRepository.findById(id);
        if (!task) {
            res.status(404).json({ success: false, error: 'Task not found' });
            return;
        }
        res.json({ success: true, task });
    }
    async updateTask(req, res) {
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
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.errors
                });
            }
            else {
                throw error;
            }
        }
    }
    async cancelTask(req, res) {
        const { id } = req.params;
        const cancelled = await this.taskQueue.cancelTask(id);
        if (!cancelled) {
            res.status(404).json({ success: false, error: 'Task not found or cannot be cancelled' });
            return;
        }
        await this.taskRepository.updateStatus(id, TaskStatus.CANCELLED);
        res.json({ success: true, message: 'Task cancelled' });
    }
    async retryTask(req, res) {
        const { id } = req.params;
        const retried = await this.taskQueue.retryTask(id);
        if (!retried) {
            res.status(404).json({ success: false, error: 'Task not found or cannot be retried' });
            return;
        }
        res.json({ success: true, message: 'Task queued for retry' });
    }
    async listTasks(req, res) {
        const { status, type, limit = '20' } = req.query;
        let tasks;
        if (status && Object.values(TaskStatus).includes(status)) {
            tasks = await this.taskRepository.findByStatus(status);
        }
        else if (type) {
            tasks = await this.taskRepository.findByType(type);
        }
        else {
            tasks = await this.taskRepository.getRecentTasks(parseInt(limit));
        }
        res.json({ success: true, tasks, count: tasks.length });
    }
    async getTaskChildren(req, res) {
        const { id } = req.params;
        const children = await this.taskRepository.findByParentId(id);
        res.json({ success: true, tasks: children, count: children.length });
    }
    async getQueueStatus(req, res) {
        const status = await this.taskQueue.getStatus();
        res.json({ success: true, status });
    }
    async getMetrics(req, res) {
        const metrics = await this.taskQueue.getMetrics();
        res.json({ success: true, metrics });
    }
    async getStats(req, res) {
        const stats = await this.taskRepository.getStats();
        res.json({ success: true, stats });
    }
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    getRouter() {
        return this.router;
    }
}
//# sourceMappingURL=rest-api.js.map