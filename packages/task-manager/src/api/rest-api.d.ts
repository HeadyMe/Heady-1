import { Router } from 'express';
import { TaskQueue } from '../core/task-queue.js';
import { TaskRepository } from '../persistence/task-repository.js';
export declare class TaskRestAPI {
    private taskQueue;
    private taskRepository;
    private router;
    constructor(taskQueue: TaskQueue, taskRepository: TaskRepository);
    private setupRoutes;
    private createTask;
    private getTask;
    private updateTask;
    private cancelTask;
    private retryTask;
    private listTasks;
    private getTaskChildren;
    private getQueueStatus;
    private getMetrics;
    private getStats;
    private asyncHandler;
    getRouter(): Router;
}
//# sourceMappingURL=rest-api.d.ts.map