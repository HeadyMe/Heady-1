/**
 * System Integration Module
 * Orchestrates all components for optimal node connectivity and performance
 */
import { EventEmitter } from 'events';
import { TaskManager } from './task-manager.js';
import { ArenaManager } from './arena-manager.js';
import 'dotenv/config';
export interface SystemConfig {
    databaseUrl: string;
    deterministicSeed?: string;
    enableMonitoring?: boolean;
    monitoringInterval?: number;
    maxConcurrentTasks?: number;
    taskTimeoutMs?: number;
    protocolPort?: number;
    enableCompression?: boolean;
    nodeRegistryPath?: string;
    promptsPath?: string;
    enableArena?: boolean;
}
export interface SystemStatus {
    initialized: boolean;
    running: boolean;
    nodes: {
        total: number;
        online: number;
        degraded: number;
        offline: number;
    };
    tasks: {
        queued: number;
        active: number;
        completed: number;
        failed: number;
    };
    performance: {
        cpuAverage: number;
        memoryAverage: number;
        throughput: number;
        errorRate: number;
    };
    protocol: {
        messagesSent: number;
        messagesReceived: number;
        pendingAcks: number;
    };
    arena?: {
        activeMatches: number;
    };
}
export declare class SystemIntegrator extends EventEmitter {
    private config;
    private taskManager;
    private orchestrator;
    private monitor;
    private workflowEngine;
    private router;
    private protocol;
    private arenaManager;
    private nodeRegistry;
    private prompts;
    private running;
    private statusInterval;
    constructor(config: SystemConfig);
    initialize(): Promise<void>;
    private loadConfigurations;
    private registerPredefinedWorkflows;
    private registerNodesFromRegistry;
    private setupProtocolHandlers;
    private setupOrchestratorHandlers;
    private setupMonitorHandlers;
    private setupArenaHandlers;
    private setupRouterHandlers;
    private handleCriticalAlert;
    private handleRecoveryRequest;
    getTaskManager(): TaskManager;
    getArenaManager(): ArenaManager | undefined;
    private startStatusReporting;
    submitTask(taskData: {
        type: string;
        name: string;
        payload?: any;
        priority?: number;
        requiredTools?: string[];
        deterministic?: boolean;
        targetNode?: string;
    }): Promise<string>;
    getStatus(): SystemStatus;
    private generateSeed;
    start(): Promise<void>;
    stop(): Promise<void>;
    getNodeCapabilities(nodeId: string): any;
    getNodePrompt(nodeId: string): any;
    healthCheck(): Promise<{
        healthy: boolean;
        checks: {
            name: string;
            status: 'pass' | 'fail' | 'warn';
            message: string;
        }[];
    }>;
}
export declare function createSystemConfig(databaseUrl: string, overrides?: Partial<SystemConfig>): SystemConfig;
//# sourceMappingURL=system-integrator.d.ts.map