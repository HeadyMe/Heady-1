import { z } from 'zod';
export declare enum TaskStatus {
    PENDING = "pending",
    QUEUED = "queued",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    RETRYING = "retrying"
}
export declare enum TaskPriority {
    CRITICAL = 1,
    HIGH = 2,
    NORMAL = 3,
    LOW = 4
}
export declare const TaskSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    payload: z.ZodAny;
    status: z.ZodNativeEnum<typeof TaskStatus>;
    priority: z.ZodNativeEnum<typeof TaskPriority>;
    attempts: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
    progress: z.ZodDefault<z.ZodNumber>;
    result: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    scheduledFor: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    parentTaskId: z.ZodOptional<z.ZodString>;
    childTaskIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    status: TaskStatus;
    type: string;
    priority: TaskPriority;
    attempts: number;
    maxRetries: number;
    progress: number;
    createdAt: Date;
    result?: any;
    error?: string | undefined;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    payload?: any;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
    scheduledFor?: Date | undefined;
    parentTaskId?: string | undefined;
    childTaskIds?: string[] | undefined;
}, {
    id: string;
    name: string;
    status: TaskStatus;
    type: string;
    priority: TaskPriority;
    createdAt: Date;
    result?: any;
    error?: string | undefined;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    payload?: any;
    attempts?: number | undefined;
    maxRetries?: number | undefined;
    progress?: number | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
    scheduledFor?: Date | undefined;
    parentTaskId?: string | undefined;
    childTaskIds?: string[] | undefined;
}>;
export type Task = z.infer<typeof TaskSchema>;
export interface TaskExecutor<T = any, R = any> {
    type: string;
    execute(payload: T, task: Task): Promise<R>;
    validate?(payload: T): Promise<boolean>;
    onProgress?(progress: number, task: Task): void;
}
export interface TaskEvent {
    taskId: string;
    event: 'created' | 'queued' | 'started' | 'progress' | 'completed' | 'failed' | 'cancelled' | 'retried';
    timestamp: Date;
    data?: any;
}
export interface TaskMetrics {
    totalTasks: number;
    pendingTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    avgExecutionTime: number;
    throughput: number;
    errorRate: number;
}
//# sourceMappingURL=task.types.d.ts.map