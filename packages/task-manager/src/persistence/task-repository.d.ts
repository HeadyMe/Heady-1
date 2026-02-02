import { Task, TaskStatus } from '../types/task.types.js';
export declare class TaskRepository {
    private pool;
    constructor(connectionString: string);
    initialize(): Promise<void>;
    save(task: Task): Promise<Task>;
    findById(id: string): Promise<Task | null>;
    findByStatus(status: TaskStatus): Promise<Task[]>;
    findByType(type: string): Promise<Task[]>;
    findByParentId(parentId: string): Promise<Task[]>;
    updateStatus(id: string, status: TaskStatus): Promise<void>;
    updateProgress(id: string, progress: number): Promise<void>;
    markStarted(id: string): Promise<void>;
    markCompleted(id: string, result?: any): Promise<void>;
    markFailed(id: string, error: string): Promise<void>;
    getStats(): Promise<{
        total: number;
        byStatus: Record<TaskStatus, number>;
        byType: Record<string, number>;
    }>;
    getRecentTasks(limit?: number): Promise<Task[]>;
    cleanup(olderThan: Date): Promise<number>;
    private mapRowToTask;
    close(): Promise<void>;
}
//# sourceMappingURL=task-repository.d.ts.map