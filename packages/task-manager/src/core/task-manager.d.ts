import { EventEmitter } from 'eventemitter3';
import { Task, TaskStatus, TaskExecutor } from '../types/task.types.js';
import { QueueConfig } from './task-queue.js';
import { TaskWebSocketServer } from './websocket-server.js';
export interface TaskManagerConfig {
    queue: QueueConfig;
    database: {
        connectionString: string;
    };
    monitoring?: {
        enabled: boolean;
        interval: number;
    };
    maxConcurrentTasks?: number;
    deterministicSeed?: string;
}
export declare class TaskManager extends EventEmitter {
    private config;
    private taskQueue;
    private taskRepository;
    private websocketServer?;
    private metricsCollector?;
    private executors;
    private isRunning;
    private metricsInterval?;
    constructor(config: TaskManagerConfig);
    private setupEventHandlers;
    initialize(): Promise<void>;
    private registerBuiltInExecutors;
    registerExecutor(executor: TaskExecutor): void;
    createTask(taskData: Partial<Task>): Promise<Task>;
    createChildTask(parentId: string, taskData: Partial<Task>): Promise<Task>;
    getTask(taskId: string): Promise<Task | null>;
    cancelTask(taskId: string): Promise<boolean>;
    retryTask(taskId: string): Promise<boolean>;
    private handleTaskCreated;
    private handleTaskQueued;
    private handleTaskStarted;
    private handleTaskProgress;
    private handleTaskCompleted;
    private handleTaskFailed;
    private handleTaskCancelled;
    private startMetricsCollection;
    attachWebSocketServer(wsServer: TaskWebSocketServer): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    getQueueStatus(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: number;
    }>;
    getMetrics(): Promise<{
        queue: {
            throughput: number;
            errorRate: number;
            avgWaitTime: number;
            avgProcessTime: number;
        };
        database: {
            total: number;
            byStatus: Record<TaskStatus, number>;
            byType: Record<string, number>;
        };
        websocket: {
            connections: number;
            subscriptions: number;
        } | null;
    }>;
    getStats(): Promise<{
        total: number;
        byStatus: Record<TaskStatus, number>;
        byType: Record<string, number>;
    }>;
    getRecentTasks(limit?: number): Promise<Task[]>;
    cleanup(olderThan: Date): Promise<number>;
    submitTask(taskData: any): Promise<string>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=task-manager.d.ts.map