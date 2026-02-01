import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { TaskEvent, Task, TaskMetrics } from '../types/task.types.js';
import { logger } from '../utils/logger.js';

export interface WebSocketConfig {
  cors: {
    origin: string | string[];
    credentials?: boolean;
  };
  pingInterval?: number;
  pingTimeout?: number;
}

export class TaskWebSocketServer {
  private io: SocketServer;
  private connections: Map<string, Socket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // taskId -> socketIds

  constructor(
    httpServer: HttpServer,
    private config: WebSocketConfig
  ) {
    this.io = new SocketServer(httpServer, {
      cors: config.cors,
      pingInterval: config.pingInterval || 25000,
      pingTimeout: config.pingTimeout || 20000,
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      this.connections.set(clientId, socket);
      
      logger.info(`WebSocket client connected: ${clientId}`);
      
      // Send initial connection acknowledgment
      socket.emit('connected', { 
        id: clientId, 
        timestamp: new Date().toISOString() 
      });

      // Handle task subscriptions
      socket.on('subscribe:task', (taskId: string) => {
        this.subscribeToTask(clientId, taskId);
        socket.emit('subscribed:task', { taskId });
      });

      socket.on('unsubscribe:task', (taskId: string) => {
        this.unsubscribeFromTask(clientId, taskId);
        socket.emit('unsubscribed:task', { taskId });
      });

      // Handle room subscriptions for task types
      socket.on('subscribe:type', (taskType: string) => {
        socket.join(`type:${taskType}`);
        socket.emit('subscribed:type', { taskType });
      });

      socket.on('unsubscribe:type', (taskType: string) => {
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

  private subscribeToTask(clientId: string, taskId: string): void {
    if (!this.subscriptions.has(taskId)) {
      this.subscriptions.set(taskId, new Set());
    }
    this.subscriptions.get(taskId)!.add(clientId);
    
    const socket = this.connections.get(clientId);
    if (socket) {
      socket.join(`task:${taskId}`);
    }
  }

  private unsubscribeFromTask(clientId: string, taskId: string): void {
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

  private handleDisconnect(clientId: string): void {
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
  emitTaskEvent(event: TaskEvent): void {
    // Emit to task-specific room
    this.io.to(`task:${event.taskId}`).emit('task:event', event);
    
    // Emit to all-tasks room
    this.io.to('all-tasks').emit('task:event', event);
    
    // If task has a type, emit to type-specific room
    if (event.data?.type) {
      this.io.to(`type:${event.data.type}`).emit('task:event', event);
    }
  }

  emitTaskCreated(task: Task): void {
    const event: TaskEvent = {
      taskId: task.id,
      event: 'created',
      timestamp: new Date(),
      data: task,
    };
    this.emitTaskEvent(event);
  }

  emitTaskStarted(taskId: string, data?: any): void {
    const event: TaskEvent = {
      taskId,
      event: 'started',
      timestamp: new Date(),
      data,
    };
    this.emitTaskEvent(event);
  }

  emitTaskProgress(taskId: string, progress: number, data?: any): void {
    const event: TaskEvent = {
      taskId,
      event: 'progress',
      timestamp: new Date(),
      data: { progress, ...data },
    };
    this.emitTaskEvent(event);
  }

  emitTaskCompleted(taskId: string, result?: any): void {
    const event: TaskEvent = {
      taskId,
      event: 'completed',
      timestamp: new Date(),
      data: { result },
    };
    this.emitTaskEvent(event);
  }

  emitTaskFailed(taskId: string, error: string): void {
    const event: TaskEvent = {
      taskId,
      event: 'failed',
      timestamp: new Date(),
      data: { error },
    };
    this.emitTaskEvent(event);
  }

  emitMetrics(metrics: TaskMetrics): void {
    this.io.to('metrics').emit('metrics:update', {
      timestamp: new Date().toISOString(),
      metrics,
    });
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Send to specific client
  sendToClient(clientId: string, event: string, data: any): void {
    const socket = this.connections.get(clientId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  // Get connected clients count
  getConnectionsCount(): number {
    return this.connections.size;
  }

  // Get task subscriptions count
  getSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  // Graceful shutdown
  async close(): Promise<void> {
    this.io.disconnectSockets(true);
    await this.io.close();
    this.connections.clear();
    this.subscriptions.clear();
    logger.info('WebSocket server closed');
  }
}
