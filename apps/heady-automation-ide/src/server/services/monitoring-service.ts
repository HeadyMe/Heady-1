/**
 * Real-time Monitoring Service for Heady Automation IDE
 * Tracks system health, performance, and resource usage
 */

import { EventEmitter } from 'events';
import os from 'os';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  process: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: number;
  };
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastCheck: number;
  responseTime?: number;
  errorCount: number;
  uptime: number;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  service?: string;
  resolved: boolean;
  resolvedAt?: number;
}

export class MonitoringService extends EventEmitter {
  private metricsHistory: SystemMetrics[] = [];
  private maxHistorySize = 1000;
  private serviceStatuses = new Map<string, ServiceStatus>();
  private alerts: Alert[] = [];
  private alertIdCounter = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Start monitoring
   */
  startMonitoring(intervalMs = 5000): void {
    if (this.isMonitoring) {
      logger.warn('Monitoring already started');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkHealth();
    }, intervalMs);

    logger.info('Monitoring started', { intervalMs });
    this.emit('monitoring:started', { intervalMs });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    logger.info('Monitoring stopped');
    this.emit('monitoring:stopped');
  }

  /**
   * Collect system metrics
   */
  private collectMetrics(): void {
    const systemMetrics: SystemMetrics = {
      timestamp: Date.now(),
      cpu: {
        usage: this.getCPUUsage(),
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      process: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage().user / 1000000, // Convert to seconds
      },
    };

    this.metricsHistory.push(systemMetrics);

    // Keep only recent history
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    // Record to metrics system
    metrics.record('cpu_usage', systemMetrics.cpu.usage);
    metrics.record('memory_usage_percent', systemMetrics.memory.usagePercent);
    metrics.record('process_memory_mb', systemMetrics.process.memory.heapUsed / 1024 / 1024);

    this.emit('metrics:collected', systemMetrics);

    // Check for alerts
    this.checkResourceAlerts(systemMetrics);
  }

  /**
   * Get CPU usage percentage
   */
  private getCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (100 * idle) / total;

    return Math.round(usage * 100) / 100;
  }

  /**
   * Check system health
   */
  private checkHealth(): void {
    const services = metrics.getServiceHealth();

    services.forEach((service) => {
      const status: ServiceStatus = {
        name: service.service,
        status: service.status,
        lastCheck: Date.now(),
        responseTime: service.avgResponseTime,
        errorCount: service.errorCount,
        uptime: service.uptime || 0,
      };

      this.serviceStatuses.set(service.service, status);

      // Emit health change events
      this.emit('service:health', status);
    });
  }

  /**
   * Check for resource alerts
   */
  private checkResourceAlerts(systemMetrics: SystemMetrics): void {
    // CPU alert
    if (systemMetrics.cpu.usage > 90) {
      this.createAlert('critical', 'High CPU usage detected', 'system', {
        usage: systemMetrics.cpu.usage,
      });
    } else if (systemMetrics.cpu.usage > 75) {
      this.createAlert('warning', 'Elevated CPU usage', 'system', {
        usage: systemMetrics.cpu.usage,
      });
    }

    // Memory alert
    if (systemMetrics.memory.usagePercent > 90) {
      this.createAlert('critical', 'High memory usage detected', 'system', {
        usagePercent: systemMetrics.memory.usagePercent,
      });
    } else if (systemMetrics.memory.usagePercent > 75) {
      this.createAlert('warning', 'Elevated memory usage', 'system', {
        usagePercent: systemMetrics.memory.usagePercent,
      });
    }

    // Process memory alert
    const processMemoryMB = systemMetrics.process.memory.heapUsed / 1024 / 1024;
    if (processMemoryMB > 500) {
      this.createAlert('warning', 'High process memory usage', 'process', {
        memoryMB: processMemoryMB,
      });
    }
  }

  /**
   * Create an alert
   */
  createAlert(
    severity: 'info' | 'warning' | 'critical',
    message: string,
    service?: string,
    metadata?: Record<string, any>
  ): Alert {
    // Check for duplicate alerts
    const existing = this.alerts.find(
      (a) => !a.resolved && a.message === message && a.service === service
    );

    if (existing) {
      return existing; // Don't create duplicate
    }

    const alert: Alert = {
      id: `alert_${++this.alertIdCounter}_${Date.now()}`,
      severity,
      message,
      timestamp: Date.now(),
      service,
      resolved: false,
    };

    this.alerts.push(alert);

    logger.warn('Alert created', {
      alertId: alert.id,
      severity,
      message,
      service,
    });

    this.emit('alert:created', alert);
    metrics.record('alert_created', 1, { severity, service: service || 'system' });

    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert || alert.resolved) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();

    logger.info('Alert resolved', { alertId });

    this.emit('alert:resolved', alert);

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((a) => !a.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit = 100): Alert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get latest system metrics
   */
  getLatestMetrics(): SystemMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(since?: number, limit = 100): SystemMetrics[] {
    let history = this.metricsHistory;

    if (since) {
      history = history.filter((m) => m.timestamp >= since);
    }

    return history.slice(-limit);
  }

  /**
   * Get service statuses
   */
  getServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Get service status by name
   */
  getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.serviceStatuses.get(serviceName);
  }

  /**
   * Update service status manually
   */
  updateServiceStatus(serviceName: string, status: Partial<ServiceStatus>): void {
    const existing = this.serviceStatuses.get(serviceName) || {
      name: serviceName,
      status: 'offline' as const,
      lastCheck: Date.now(),
      errorCount: 0,
      uptime: 0,
    };

    const updated = { ...existing, ...status, lastCheck: Date.now() };
    this.serviceStatuses.set(serviceName, updated);

    this.emit('service:status', updated);
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    metricsCount: number;
    activeAlerts: number;
    services: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      metricsCount: this.metricsHistory.length,
      activeAlerts: this.getActiveAlerts().length,
      services: this.serviceStatuses.size,
    };
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();
