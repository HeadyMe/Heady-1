import express from 'express';
import { TaskManager, TaskManagerConfig } from './core/task-manager.js';
export * from './types/task.types.js';
export * from './core/task-manager.js';
export * from './core/task-queue.js';
export * from './core/websocket-server.js';
export * from './persistence/task-repository.js';
export * from './api/rest-api.js';
export * from './monitoring/metrics-collector.js';
export interface TaskSystemConfig extends TaskManagerConfig {
    server: {
        port: number;
        host?: string;
    };
    websocket?: {
        cors: {
            origin: string | string[];
            credentials?: boolean;
        };
    };
}
export declare class TaskSystem {
    private config;
    private app;
    private httpServer;
    private taskManager;
    private wsServer;
    private restApi;
    private isRunning;
    constructor(config: TaskSystemConfig);
    private setupMiddleware;
    private setupRoutes;
    start(): Promise<void>;
    stop(): Promise<void>;
    getTaskManager(): TaskManager;
    getApp(): express.Application;
}
export default function createTaskSystem(config: TaskSystemConfig): TaskSystem;
export { NodeOrchestrator, NodeStatus, MessageType } from './core/node-orchestrator.js';
export type { NodeCapabilities, RoutingStrategy } from './core/node-orchestrator.js';
export { DeterministicWorkflowEngine, PREDEFINED_WORKFLOWS } from './core/deterministic-workflow.js';
export type { Workflow, WorkflowStep } from './core/deterministic-workflow.js';
export { OptimizedTaskRouter } from './core/optimized-task-router.js';
export type { Task as RouterTask, TaskResult, RoutingDecision } from './core/optimized-task-router.js';
export { NodeCommunicationProtocol, PROTOCOL_CONSTANTS } from './core/communication-protocol.js';
export type { ProtocolMessage, MessageType as ProtocolMessageType } from './core/communication-protocol.js';
export { SystemIntegrator, createSystemConfig } from './core/system-integrator.js';
export type { SystemConfig, SystemStatus } from './core/system-integrator.js';
export { PerformanceMonitor } from './monitoring/performance-monitor.js';
export type { MetricPoint, PerformanceMetrics, HealthCheck } from './monitoring/performance-monitor.js';
export { ArenaManager } from './core/arena-manager.js';
export { SquashMerger } from './core/squash-merger.js';
export * from './core/arena-protocol.js';
export declare const VERSION = "2.0.0";
export declare const OPTIMIZED_SYSTEM_VERSION = "2.0.0";
export declare function initializeOptimizedSystem(config: {
    databaseUrl: string;
    deterministicSeed?: string;
}): Promise<import('./core/system-integrator.js').SystemIntegrator>;
//# sourceMappingURL=index.d.ts.map