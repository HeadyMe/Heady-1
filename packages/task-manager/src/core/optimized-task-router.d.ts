import { EventEmitter } from 'events';
import { NodeOrchestrator } from './node-orchestrator.js';
import { PerformanceMonitor } from '../monitoring/performance-monitor.js';
import { DeterministicWorkflowEngine } from './deterministic-workflow.js';
export interface Task {
    id: string;
    type: string;
    name: string;
    payload: any;
    priority: number;
    requiredTools: string[];
    targetNode?: string;
    timeoutMs: number;
    deterministic: boolean;
}
export interface TaskResult {
    taskId: string;
    nodeId: string;
    success: boolean;
    result?: any;
    error?: string;
    duration: number;
    timestamp: number;
}
export interface RoutingDecision {
    taskId: string;
    selectedNode: string;
    strategy: string;
    reason: string;
    alternatives: string[];
    estimatedLatency: number;
}
export declare class OptimizedTaskRouter extends EventEmitter {
    private orchestrator;
    private monitor;
    private workflowEngine;
    private taskQueue;
    private activeTasks;
    private completedTasks;
    private readonly maxConcurrentPerNode;
    private readonly taskTimeoutMs;
    private processingInterval;
    constructor(orchestrator: NodeOrchestrator, monitor: PerformanceMonitor, workflowEngine: DeterministicWorkflowEngine);
    submitTask(task: Omit<Task, 'id'>): Promise<string>;
    private processQueue;
    private makeRoutingDecision;
    private assignTask;
    handleTaskComplete(taskId: string, nodeId: string, result: any): void;
    handleTaskFailed(taskId: string, nodeId: string, error: string): void;
    private handleTaskTimeout;
    private setupEventHandlers;
    private startProcessingLoop;
    private generateTaskId;
    private hashString;
    getStats(): {
        queuedTasks: number;
        activeTasks: number;
        completedTasks: number;
        failedTasks: number;
        averageTaskDuration: number;
    };
    getTaskStatus(taskId: string): {
        status: 'queued' | 'active' | 'completed' | 'failed' | 'unknown';
        result?: TaskResult;
    };
    dispose(): void;
}
//# sourceMappingURL=optimized-task-router.d.ts.map