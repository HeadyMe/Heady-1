import { Job } from 'bullmq';
import { EventEmitter } from 'eventemitter3';
import { Task } from '../types/task.types.js';
export interface QueueConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
    };
    concurrency: number;
    maxRetries: number;
    retryDelay: number;
}
export declare class TaskQueue extends EventEmitter {
    private name;
    private config;
    private queue;
    private worker;
    private queueEvents;
    private connection;
    private executors;
    private activeJobs;
    constructor(name: string, config: QueueConfig);
    private setupEventListeners;
    registerExecutor(type: string, executor: Function): void;
    enqueue(task: Partial<Task>): Promise<string>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getTask(taskId: string): Promise<Job | null>;
    cancelTask(taskId: string): Promise<boolean>;
    retryTask(taskId: string): Promise<boolean>;
    getStatus(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: number;
    }>;
    getMetrics(): Promise<{
        throughput: number;
        errorRate: number;
        avgWaitTime: number;
        avgProcessTime: number;
    }>;
    clearCompleted(): Promise<void>;
    clearFailed(): Promise<void>;
}
//# sourceMappingURL=task-queue.d.ts.map