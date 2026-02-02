/**
 * Optimized Node Communication Protocol
 * Ensures reliable, high-performance inter-node communication
 */
import { EventEmitter } from 'events';
export var MessageType;
(function (MessageType) {
    // Control messages
    MessageType["HANDSHAKE"] = "HANDSHAKE";
    MessageType["HEARTBEAT"] = "HEARTBEAT";
    MessageType["DISCONNECT"] = "DISCONNECT";
    // Task messages
    MessageType["TASK_REQUEST"] = "TASK_REQUEST";
    MessageType["TASK_ASSIGN"] = "TASK_ASSIGN";
    MessageType["TASK_ACCEPT"] = "TASK_ACCEPT";
    MessageType["TASK_REJECT"] = "TASK_REJECT";
    MessageType["TASK_PROGRESS"] = "TASK_PROGRESS";
    MessageType["TASK_COMPLETE"] = "TASK_COMPLETE";
    MessageType["TASK_FAIL"] = "TASK_FAIL";
    // Coordination messages
    MessageType["CAPABILITY_UPDATE"] = "CAPABILITY_UPDATE";
    MessageType["LOAD_REPORT"] = "LOAD_REPORT";
    MessageType["RECOVERY_REQUEST"] = "RECOVERY_REQUEST";
    MessageType["RECOVERY_RESPONSE"] = "RECOVERY_RESPONSE";
    // Performance messages
    MessageType["METRICS_REPORT"] = "METRICS_REPORT";
    MessageType["LATENCY_PROBE"] = "LATENCY_PROBE";
    MessageType["LATENCY_RESPONSE"] = "LATENCY_RESPONSE";
})(MessageType || (MessageType = {}));
export class NodeCommunicationProtocol extends EventEmitter {
    config;
    sequenceNumber = 0;
    pendingMessages = new Map();
    messageHistory = new Map(); // For deduplication
    maxHistorySize = 10000;
    constructor(config = {}) {
        super();
        this.config = {
            messageTimeoutMs: 30000,
            heartbeatIntervalMs: 10000,
            maxRetries: 3,
            compressionThreshold: 1024,
            batchSize: 10,
            enableCompression: true,
            ...config,
        };
    }
    // Create a new protocol message
    createMessage(source, target, type, payload, priority = 5) {
        this.sequenceNumber++;
        const timestamp = Date.now();
        const id = this.generateMessageId(source, target, timestamp);
        const message = {
            id,
            version: '1.0',
            source,
            target,
            type,
            payload: this.optimizePayload(payload),
            timestamp,
            sequenceNumber: this.sequenceNumber,
            priority,
            ttl: timestamp + this.config.messageTimeoutMs,
            checksum: '', // Will be calculated
        };
        message.checksum = this.calculateChecksum(message);
        return message;
    }
    // Send message with guaranteed delivery
    async send(message) {
        return new Promise((resolve, reject) => {
            // Check for duplicate
            if (this.messageHistory.has(message.id)) {
                resolve({ status: 'duplicate', message: 'Message already processed' });
                return;
            }
            const timer = setTimeout(() => {
                this.handleTimeout(message.id);
            }, this.config.messageTimeoutMs);
            this.pendingMessages.set(message.id, {
                message,
                resolve,
                reject,
                retries: 0,
                timer,
            });
            this.emit('message:outgoing', message);
        });
    }
    // Receive and process incoming message
    receive(message) {
        // Validate message
        if (!this.validateMessage(message)) {
            this.emit('message:invalid', message);
            return false;
        }
        // Check for duplicates
        if (this.messageHistory.has(message.id)) {
            return false;
        }
        // Track message
        this.messageHistory.set(message.id, Date.now());
        this.cleanupHistory();
        // Check if this is a response to a pending message
        const pending = this.pendingMessages.get(message.id);
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingMessages.delete(message.id);
            pending.resolve(message.payload);
            return true;
        }
        // Process based on message type
        this.processMessage(message);
        return true;
    }
    // Process message based on type
    processMessage(message) {
        switch (message.type) {
            case MessageType.HEARTBEAT:
                this.emit('heartbeat', {
                    nodeId: message.source,
                    timestamp: message.timestamp,
                    payload: message.payload,
                });
                break;
            case MessageType.TASK_REQUEST:
            case MessageType.TASK_ASSIGN:
                this.emit('task:incoming', message);
                break;
            case MessageType.TASK_PROGRESS:
                this.emit('task:progress', message);
                break;
            case MessageType.TASK_COMPLETE:
            case MessageType.TASK_FAIL:
                this.emit('task:finished', message);
                break;
            case MessageType.METRICS_REPORT:
                this.emit('metrics', {
                    nodeId: message.source,
                    metrics: message.payload,
                });
                break;
            case MessageType.RECOVERY_REQUEST:
                this.emit('recovery:request', message);
                break;
            case MessageType.CAPABILITY_UPDATE:
                this.emit('capabilities:update', {
                    nodeId: message.source,
                    capabilities: message.payload,
                });
                break;
            default:
                this.emit('message:received', message);
        }
    }
    // Handle message timeout
    handleTimeout(messageId) {
        const pending = this.pendingMessages.get(messageId);
        if (!pending)
            return;
        if (pending.retries < this.config.maxRetries) {
            pending.retries++;
            this.emit('message:retry', {
                messageId,
                attempt: pending.retries,
                maxRetries: this.config.maxRetries,
            });
            // Resend
            const timer = setTimeout(() => {
                this.handleTimeout(messageId);
            }, this.config.messageTimeoutMs * Math.pow(2, pending.retries)); // Exponential backoff
            pending.timer = timer;
            this.emit('message:outgoing', pending.message);
        }
        else {
            this.pendingMessages.delete(messageId);
            pending.reject(new Error(`Message ${messageId} failed after ${this.config.maxRetries} retries`));
        }
    }
    // Validate message integrity
    validateMessage(message) {
        // Check required fields
        if (!message.id || !message.source || !message.target || !message.type) {
            return false;
        }
        // Check version compatibility
        if (message.version !== '1.0') {
            this.emit('message:version-mismatch', message);
            return false;
        }
        // Check TTL
        if (Date.now() > message.ttl) {
            this.emit('message:expired', message);
            return false;
        }
        // Verify checksum
        const { checksum, ...messageWithoutChecksum } = message;
        const calculatedChecksum = this.calculateChecksum(messageWithoutChecksum);
        if (calculatedChecksum !== message.checksum) {
            this.emit('message:checksum-failed', message);
            return false;
        }
        return true;
    }
    // Optimize payload (compression for large messages)
    optimizePayload(payload) {
        const serialized = JSON.stringify(payload);
        if (this.config.enableCompression && serialized.length > this.config.compressionThreshold) {
            // In real implementation, use zlib or similar
            return {
                _compressed: true,
                _originalSize: serialized.length,
                data: payload, // Placeholder - would be compressed
            };
        }
        return payload;
    }
    // Calculate message checksum
    calculateChecksum(message) {
        const data = `${message.id}:${message.source}:${message.target}:${message.type}:${message.timestamp}:${message.sequenceNumber}:${JSON.stringify(message.payload)}`;
        return this.simpleHash(data);
    }
    // Simple hash function for checksum
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    // Generate unique message ID
    generateMessageId(source, target, timestamp) {
        return `${source}-${target}-${timestamp}-${this.sequenceNumber}`;
    }
    // Cleanup old message history
    cleanupHistory() {
        if (this.messageHistory.size > this.maxHistorySize) {
            const entries = Array.from(this.messageHistory.entries());
            const toRemove = entries.slice(0, entries.length - this.maxHistorySize);
            toRemove.forEach(([id]) => this.messageHistory.delete(id));
        }
    }
    // Create heartbeat message
    createHeartbeat(nodeId, status) {
        return this.createMessage(nodeId, '*', // Broadcast
        MessageType.HEARTBEAT, {
            status: status.status || 'online',
            load: status.load || 0,
            metrics: status.metrics || {},
        }, 10 // High priority
        );
    }
    // Batch multiple messages
    createBatch(messages) {
        const source = messages[0]?.source || 'unknown';
        const target = messages[0]?.target || 'unknown';
        return this.createMessage(source, target, MessageType.METRICS_REPORT, // Use as batch carrier
        {
            _batch: true,
            messages: messages.map(m => ({
                type: m.type,
                payload: m.payload,
                priority: m.priority,
            })),
        }, Math.max(...messages.map(m => m.priority)));
    }
    // Get protocol statistics
    getStats() {
        return {
            pendingMessages: this.pendingMessages.size,
            messageHistory: this.messageHistory.size,
            sequenceNumber: this.sequenceNumber,
        };
    }
    // Acknowledge message receipt
    createAck(originalMessage) {
        return this.createMessage(originalMessage.target, originalMessage.source, MessageType.TASK_ACCEPT, // Use as generic ACK
        {
            ackId: originalMessage.id,
            receivedAt: Date.now(),
        }, 10);
    }
    // Dispose
    dispose() {
        // Clear all pending timeouts
        this.pendingMessages.forEach(pending => {
            clearTimeout(pending.timer);
            pending.reject(new Error('Protocol disposed'));
        });
        this.pendingMessages.clear();
        this.messageHistory.clear();
        this.removeAllListeners();
    }
}
// Protocol constants
export const PROTOCOL_CONSTANTS = {
    VERSION: '1.0',
    DEFAULT_PORT: 9000,
    HEARTBEAT_INTERVAL: 10000,
    HEARTBEAT_TIMEOUT: 30000,
    MAX_MESSAGE_SIZE: 1048576, // 1MB
    BATCH_INTERVAL: 100, // ms
};
//# sourceMappingURL=communication-protocol.js.map