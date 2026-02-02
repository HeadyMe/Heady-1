import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger.js';
export class TaskWebSocketServer {
    config;
    io;
    connections = new Map();
    subscriptions = new Map(); // taskId -> socketIds
    constructor(httpServer, config) {
        this.config = config;
        this.io = new SocketServer(httpServer, {
            cors: config.cors,
            pingInterval: config.pingInterval || 25000,
            pingTimeout: config.pingTimeout || 20000,
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.io.on('connection', (socket) => {
            const clientId = socket.id;
            this.connections.set(clientId, socket);
            logger.info(`WebSocket client connected: ${clientId}`);
            // Send initial connection acknowledgment
            socket.emit('connected', {
                id: clientId,
                timestamp: new Date().toISOString()
            });
            // Handle task subscriptions
            socket.on('subscribe:task', (taskId) => {
                this.subscribeToTask(clientId, taskId);
                socket.emit('subscribed:task', { taskId });
            });
            socket.on('unsubscribe:task', (taskId) => {
                this.unsubscribeFromTask(clientId, taskId);
                socket.emit('unsubscribed:task', { taskId });
            });
            // Handle room subscriptions for task types
            socket.on('subscribe:type', (taskType) => {
                socket.join(`type:${taskType}`);
                socket.emit('subscribed:type', { taskType });
            });
            socket.on('unsubscribe:type', (taskType) => {
                socket.leave(`type:${taskType}`);
                socket.emit('unsubscribed:type', { taskType });
            });
            // Subscribe to all task events
            socket.on('subscribe:all', () => {
                socket.join('all-tasks');
                socket.emit('subscribed:all', { timestamp: new Date().toISOString() });
            });
            // Handle metrics subscription
            socket.on('subscribe:metrics', () => {
                socket.join('metrics');
                socket.emit('subscribed:metrics', { timestamp: new Date().toISOString() });
            });
            // Handle disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(clientId);
            });
            // Handle errors
            socket.on('error', (error) => {
                logger.error(`WebSocket error for client ${clientId}:`, error);
            });
        });
    }
    subscribeToTask(clientId, taskId) {
        if (!this.subscriptions.has(taskId)) {
            this.subscriptions.set(taskId, new Set());
        }
        this.subscriptions.get(taskId).add(clientId);
        const socket = this.connections.get(clientId);
        if (socket) {
            socket.join(`task:${taskId}`);
        }
    }
    unsubscribeFromTask(clientId, taskId) {
        const subs = this.subscriptions.get(taskId);
        if (subs) {
            subs.delete(clientId);
            if (subs.size === 0) {
                this.subscriptions.delete(taskId);
            }
        }
        const socket = this.connections.get(clientId);
        if (socket) {
            socket.leave(`task:${taskId}`);
        }
    }
    handleDisconnect(clientId) {
        // Clean up subscriptions
        for (const [taskId, clients] of this.subscriptions.entries()) {
            if (clients.has(clientId)) {
                clients.delete(clientId);
                if (clients.size === 0) {
                    this.subscriptions.delete(taskId);
                }
            }
        }
        this.connections.delete(clientId);
        logger.info(`WebSocket client disconnected: ${clientId}`);
    }
    // Emit task events
    emitTaskEvent(event) {
        // Emit to task-specific room
        this.io.to(`task:${event.taskId}`).emit('task:event', event);
        // Emit to all-tasks room
        this.io.to('all-tasks').emit('task:event', event);
        // If task has a type, emit to type-specific room
        if (event.data?.type) {
            this.io.to(`type:${event.data.type}`).emit('task:event', event);
        }
    }
    emitTaskCreated(task) {
        const event = {
            taskId: task.id,
            event: 'created',
            timestamp: new Date(),
            data: task,
        };
        this.emitTaskEvent(event);
    }
    emitTaskStarted(taskId, data) {
        const event = {
            taskId,
            event: 'started',
            timestamp: new Date(),
            data,
        };
        this.emitTaskEvent(event);
    }
    emitTaskProgress(taskId, progress, data) {
        const event = {
            taskId,
            event: 'progress',
            timestamp: new Date(),
            data: { progress, ...data },
        };
        this.emitTaskEvent(event);
    }
    emitTaskCompleted(taskId, result) {
        const event = {
            taskId,
            event: 'completed',
            timestamp: new Date(),
            data: { result },
        };
        this.emitTaskEvent(event);
    }
    emitTaskFailed(taskId, error) {
        const event = {
            taskId,
            event: 'failed',
            timestamp: new Date(),
            data: { error },
        };
        this.emitTaskEvent(event);
    }
    emitMetrics(metrics) {
        this.io.to('metrics').emit('metrics:update', {
            timestamp: new Date().toISOString(),
            metrics,
        });
    }
    // Broadcast to all connected clients
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    // Send to specific client
    sendToClient(clientId, event, data) {
        const socket = this.connections.get(clientId);
        if (socket) {
            socket.emit(event, data);
        }
    }
    // Get connected clients count
    getConnectionsCount() {
        return this.connections.size;
    }
    // Get task subscriptions count
    getSubscriptionsCount() {
        return this.subscriptions.size;
    }
    // Graceful shutdown
    async close() {
        this.io.disconnectSockets(true);
        await this.io.close();
        this.connections.clear();
        this.subscriptions.clear();
        logger.info('WebSocket server closed');
    }
}
//# sourceMappingURL=websocket-server.js.map