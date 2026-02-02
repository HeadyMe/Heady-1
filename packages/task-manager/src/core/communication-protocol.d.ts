/**
 * Optimized Node Communication Protocol
 * Ensures reliable, high-performance inter-node communication
 */
import { EventEmitter } from 'events';
export interface ProtocolMessage {
    id: string;
    version: string;
    source: string;
    target: string;
    type: MessageType;
    payload: any;
    timestamp: number;
    sequenceNumber: number;
    priority: number;
    ttl: number;
    checksum: string;
}
export declare enum MessageType {
    HANDSHAKE = "HANDSHAKE",
    HEARTBEAT = "HEARTBEAT",
    DISCONNECT = "DISCONNECT",
    TASK_REQUEST = "TASK_REQUEST",
    TASK_ASSIGN = "TASK_ASSIGN",
    TASK_ACCEPT = "TASK_ACCEPT",
    TASK_REJECT = "TASK_REJECT",
    TASK_PROGRESS = "TASK_PROGRESS",
    TASK_COMPLETE = "TASK_COMPLETE",
    TASK_FAIL = "TASK_FAIL",
    CAPABILITY_UPDATE = "CAPABILITY_UPDATE",
    LOAD_REPORT = "LOAD_REPORT",
    RECOVERY_REQUEST = "RECOVERY_REQUEST",
    RECOVERY_RESPONSE = "RECOVERY_RESPONSE",
    METRICS_REPORT = "METRICS_REPORT",
    LATENCY_PROBE = "LATENCY_PROBE",
    LATENCY_RESPONSE = "LATENCY_RESPONSE"
}
export interface ProtocolConfig {
    messageTimeoutMs: number;
    heartbeatIntervalMs: number;
    maxRetries: number;
    compressionThreshold: number;
    batchSize: number;
    enableCompression: boolean;
}
export declare class NodeCommunicationProtocol extends EventEmitter {
    private config;
    private sequenceNumber;
    private pendingMessages;
    private messageHistory;
    private readonly maxHistorySize;
    constructor(config?: Partial<ProtocolConfig>);
    createMessage(source: string, target: string, type: MessageType, payload: any, priority?: number): ProtocolMessage;
    send(message: ProtocolMessage): Promise<any>;
    receive(message: ProtocolMessage): boolean;
    private processMessage;
    private handleTimeout;
    private validateMessage;
    private optimizePayload;
    private calculateChecksum;
    private simpleHash;
    private generateMessageId;
    private cleanupHistory;
    createHeartbeat(nodeId: string, status: any): ProtocolMessage;
    createBatch(messages: ProtocolMessage[]): ProtocolMessage;
    getStats(): {
        pendingMessages: number;
        messageHistory: number;
        sequenceNumber: number;
    };
    createAck(originalMessage: ProtocolMessage): ProtocolMessage;
    dispose(): void;
}
export declare const PROTOCOL_CONSTANTS: {
    VERSION: string;
    DEFAULT_PORT: number;
    HEARTBEAT_INTERVAL: number;
    HEARTBEAT_TIMEOUT: number;
    MAX_MESSAGE_SIZE: number;
    BATCH_INTERVAL: number;
};
//# sourceMappingURL=communication-protocol.d.ts.map