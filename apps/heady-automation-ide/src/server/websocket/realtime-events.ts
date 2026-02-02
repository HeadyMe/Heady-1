/**
 * WebSocket Real-time Events Handler
 * Broadcasts monitoring data and system events to connected clients
 * Note: Task events are bridged directly by PersistentTaskManager
 */

import { Server, Socket } from 'socket.io';
import { EventEmitter } from 'events';
import { taskManager } from '../services/task-system.js';
import { monitoringService, SystemMetrics, Alert } from '../services/monitoring-service.js';
import { logger } from '../utils/logger.js';

export class RealtimeEventsHandler extends EventEmitter {
  private io: Server;
  private connectedClients = new Set<string>();

  constructor(io: Server) {
    super();
    this.io = io;
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for monitoring service
   */
  private setupEventListeners(): void {
    // Monitoring events
    monitoringService.on('metrics:collected', (metrics: SystemMetrics) => {
      this.broadcast('system:metrics', metrics);
    });

    monitoringService.on('service:health', (status) => {
      this.broadcast('service:health', status);
    });

    monitoringService.on('alert:created', (alert: Alert) => {
      this.broadcast('alert:created', alert);
      
      // Also log critical alerts
      if (alert.severity === 'critical') {
        logger.error('Critical alert', {
          alertId: alert.id,
          message: alert.message,
          service: alert.service,
        });
      }
    });

    monitoringService.on('alert:resolved', (alert: Alert) => {
      this.broadcast('alert:resolved', alert);
    });

    logger.info('Real-time event listeners configured');
  }

  /**
   * Handle new client connection
   */
  handleConnection(socket: Socket): void {
    const clientId = socket.id;
    this.connectedClients.add(clientId);

    logger.info('Client connected', {
      clientId,
      totalClients: this.connectedClients.size,
    });

    // Send initial state to new client
    this.sendInitialState(socket);

    // Handle client subscriptions
    socket.on('subscribe:tasks', () => {
      socket.join('tasks');
      logger.debug('Client subscribed to tasks', { clientId });
    });

    socket.on('subscribe:monitoring', () => {
      socket.join('monitoring');
      logger.debug('Client subscribed to monitoring', { clientId });
    });

    socket.on('subscribe:alerts', () => {
      socket.join('alerts');
      logger.debug('Client subscribed to alerts', { clientId });
    });

    // Handle client actions
    socket.on('task:cancel', async (taskId: string) => {
      try {
        const success = await taskManager.cancelTask(taskId);
        socket.emit('task:cancel:response', { taskId, success });
      } catch (error) {
        logger.error('Failed to cancel task', { taskId, error });
        socket.emit('task:cancel:response', { taskId, success: false, error: 'Internal error' });
      }
    });

    socket.on('alert:resolve', (alertId: string) => {
      const success = monitoringService.resolveAlert(alertId);
      socket.emit('alert:resolve:response', { alertId, success });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      logger.info('Client disconnected', {
        clientId,
        totalClients: this.connectedClients.size,
      });
    });

    // Emit connection event
    this.emit('client:connected', { clientId, socket });
  }

  /**
   * Send initial state to newly connected client
   */
  private async sendInitialState(socket: Socket): Promise<void> {
    // Send current tasks
    let taskCount = 0;
    try {
      const tasks = await taskManager.getRecentTasks(50);
      taskCount = tasks.length;
      
      // Map tasks to expected frontend format
      const mappedTasks = tasks.map(t => ({
          id: t.id,
          task: {
              type: t.type,
              description: t.description || t.name,
              priority: t.priority
          },
          status: t.status.toLowerCase(),
          progress: t.progress || 0,
          startedAt: t.startedAt ? new Date(t.startedAt).getTime() : undefined,
          executionTime: t.completedAt && t.startedAt ? 
            new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime() : undefined
      }));

      socket.emit('initial:tasks', mappedTasks);

      // Send task statistics
      const stats = await taskManager.getStats();
      socket.emit('initial:stats', stats);
    } catch (error) {
      logger.error('Failed to send initial task state', { error });
    }

    // Send latest metrics
    const latestMetrics = monitoringService.getLatestMetrics();
    if (latestMetrics) {
      socket.emit('initial:metrics', latestMetrics);
    }

    // Send service statuses
    const services = monitoringService.getServiceStatuses();
    socket.emit('initial:services', services);

    // Send active alerts
    const alerts = monitoringService.getActiveAlerts();
    socket.emit('initial:alerts', alerts);

    logger.debug('Initial state sent to client', {
      clientId: socket.id,
      taskCount,
      serviceCount: services.length,
      alertCount: alerts.length,
    });
  }

  /**
   * Broadcast event to all connected clients
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Broadcast to specific room
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  /**
   * Get connected client count
   */
  getConnectedClientCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get connected client IDs
   */
  getConnectedClients(): string[] {
    return Array.from(this.connectedClients);
  }
}
