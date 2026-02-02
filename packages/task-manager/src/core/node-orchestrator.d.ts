import { EventEmitter } from 'events';
export interface NodeMessage {
    id: string;
    sourceNode: string;
    targetNode: string;
    type: MessageType;
    payload: any;
    timestamp: number;
    priority: number;
    correlationId?: string;
    ttl: number;
}
export declare enum MessageType {
    TASK_ASSIGN = "TASK_ASSIGN",
    TASK_COMPLETE = "TASK_COMPLETE",
    TASK_FAILED = "TASK_FAILED",
    HEARTBEAT = "HEARTBEAT",
    STATUS_UPDATE = "STATUS_UPDATE",
    CAPABILITY_ANNOUNCE = "CAPABILITY_ANNOUNCE",
    LOAD_BALANCE = "LOAD_BALANCE",
    ERROR_REPORT = "ERROR_REPORT",
    RECOVERY_REQUEST = "RECOVERY_REQUEST",
    DETERMINISTIC_CHECK = "DETERMINISTIC_CHECK"
}
export interface NodeCapabilities {
    nodeId: string;
    tools: string[];
    maxConcurrentTasks: number;
    currentLoad: number;
    latency: number;
    lastHeartbeat: number;
    status: NodeStatus;
    version: string;
}
export declare enum NodeStatus {
    ONLINE = "ONLINE",
    DEGRADED = "DEGRADED",
    OFFLINE = "OFFLINE",
    RECOVERING = "RECOVERING"
}
export interface RoutingStrategy {
    type: 'round-robin' | 'least-loaded' | 'capability-match' | 'deterministic';
    weights?: Record<string, number>;
}
export declare class NodeOrchestrator extends EventEmitter {
    private nodes;
    private messageQueue;
    private messageHistory;
    private routingTable;
    private readonly maxHistoryPerNode;
    private readonly heartbeatTimeout;
    private readonly messageTTL;
    private deterministicSeed;
    private routingStrategy;
    private maintenanceInterval;
    constructor(seed?: string, strategy?: RoutingStrategy);
    registerNode(nodeId: string, capabilities: Partial<NodeCapabilities>): void;
    unregisterNode(nodeId: string): void;
    sendMessage(message: Omit<NodeMessage, 'id' | 'timestamp'>): string;
    private broadcastMessage;
    private routeMessage;
    findBestNodeForTask(taskType: string, requiredTools: string[]): string | null;
    handleHeartbeat(nodeId: string, metrics: Partial<NodeCapabilities>): void;
    private checkNodeHealth;
    private triggerRecovery;
    private findAlternativeNode;
    private inferRequiredTools;
    private hashString;
    getStats(): {
        totalNodes: number;
        onlineNodes: number;
        degradedNodes: number;
        offlineNodes: number;
        messageCount: number;
        averageLatency: number;
    };
    setDeterministicSeed(seed: string): void;
    setRoutingStrategy(strategy: RoutingStrategy): void;
    private startMaintenanceLoop;
    private cleanupExpiredMessages;
    getNode(nodeId: string): NodeCapabilities | undefined;
    getAllNodes(): NodeCapabilities[];
    dispose(): void;
}
//# sourceMappingURL=node-orchestrator.d.ts.map