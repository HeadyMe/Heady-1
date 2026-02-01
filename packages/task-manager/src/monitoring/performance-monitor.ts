import { EventEmitter } from 'events';

export interface MetricPoint {
  timestamp: number;
  value: number;
  labels: Record<string, string>;
}

export interface PerformanceMetrics {
  nodeId: string;
  cpuUsage: number;
  memoryUsage: number;
  taskThroughput: number;
  averageTaskDuration: number;
  errorRate: number;
  queueDepth: number;
  networkLatency: number;
  timestamp: number;
}

export interface HealthCheck {
  nodeId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    duration: number;
  }[];
  timestamp: number;
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private metricHistory: Map<string, MetricPoint[]> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private readonly historyRetentionMs = 3600000; // 1 hour
  private alertThresholds = {
    cpuUsage: 80,
    memoryUsage: 85,
    errorRate: 5,
    queueDepth: 100,
    networkLatency: 1000,
  };

  constructor() {
    super();
    this.startMonitoringLoop();
  }

  // Record performance metrics from a node
  recordMetrics(metrics: PerformanceMetrics): void {
    const previousMetrics = this.metrics.get(metrics.nodeId);
    this.metrics.set(metrics.nodeId, metrics);

    // Store in history
    this.storeMetricHistory('cpu', metrics.nodeId, metrics.cpuUsage, {});
    this.storeMetricHistory('memory', metrics.nodeId, metrics.memoryUsage, {});
    this.storeMetricHistory('throughput', metrics.nodeId, metrics.taskThroughput, {});
    this.storeMetricHistory('latency', metrics.nodeId, metrics.networkLatency, {});
    this.storeMetricHistory('error_rate', metrics.nodeId, metrics.errorRate, {});
    this.storeMetricHistory('queue_depth', metrics.nodeId, metrics.queueDepth, {});

    // Check thresholds and emit alerts
    this.checkThresholds(metrics);

    // Emit performance update
    this.emit('metrics:updated', { nodeId: metrics.nodeId, metrics, previousMetrics });
  }

  // Store metric in history
  private storeMetricHistory(
    metricName: string,
    nodeId: string,
    value: number,
    labels: Record<string, string>
  ): void {
    const key = `${nodeId}:${metricName}`;
    const history = this.metricHistory.get(key) || [];
    
    history.push({
      timestamp: Date.now(),
      value,
      labels,
    });

    // Cleanup old entries
    const cutoff = Date.now() - this.historyRetentionMs;
    const filtered = history.filter(m => m.timestamp > cutoff);
    
    this.metricHistory.set(key, filtered);
  }

  // Check metric thresholds and emit alerts
  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: string[] = [];

    if (metrics.cpuUsage > this.alertThresholds.cpuUsage) {
      alerts.push(`CPU usage ${metrics.cpuUsage.toFixed(1)}% exceeds threshold ${this.alertThresholds.cpuUsage}%`);
    }
    if (metrics.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push(`Memory usage ${metrics.memoryUsage.toFixed(1)}% exceeds threshold ${this.alertThresholds.memoryUsage}%`);
    }
    if (metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push(`Error rate ${metrics.errorRate.toFixed(1)}% exceeds threshold ${this.alertThresholds.errorRate}%`);
    }
    if (metrics.queueDepth > this.alertThresholds.queueDepth) {
      alerts.push(`Queue depth ${metrics.queueDepth} exceeds threshold ${this.alertThresholds.queueDepth}`);
    }
    if (metrics.networkLatency > this.alertThresholds.networkLatency) {
      alerts.push(`Network latency ${metrics.networkLatency}ms exceeds threshold ${this.alertThresholds.networkLatency}ms`);
    }

    if (alerts.length > 0) {
      this.emit('alert', {
        nodeId: metrics.nodeId,
        severity: alerts.length > 2 ? 'critical' : 'warning',
        messages: alerts,
        timestamp: Date.now(),
      });
    }
  }

  // Record health check result
  recordHealthCheck(check: HealthCheck): void {
    this.healthChecks.set(check.nodeId, check);
    
    if (check.status === 'unhealthy') {
      this.emit('health:critical', { nodeId: check.nodeId, checks: check.checks });
    } else if (check.status === 'degraded') {
      this.emit('health:degraded', { nodeId: check.nodeId, checks: check.checks });
    }

    this.emit('health:updated', check);
  }

  // Get current metrics for a node
  getMetrics(nodeId: string): PerformanceMetrics | undefined {
    return this.metrics.get(nodeId);
  }

  // Get all current metrics
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  // Get metric history for analysis
  getMetricHistory(nodeId: string, metricName: string, durationMs: number = 300000): MetricPoint[] {
    const key = `${nodeId}:${metricName}`;
    const history = this.metricHistory.get(key) || [];
    const cutoff = Date.now() - durationMs;
    return history.filter(m => m.timestamp > cutoff);
  }

  // Get health check for a node
  getHealthCheck(nodeId: string): HealthCheck | undefined {
    return this.healthChecks.get(nodeId);
  }

  // Calculate performance trends
  calculateTrend(nodeId: string, metricName: string): 'improving' | 'stable' | 'degrading' {
    const history = this.getMetricHistory(nodeId, metricName, 600000); // Last 10 minutes
    
    if (history.length < 10) return 'stable';

    const half = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, half);
    const secondHalf = history.slice(half);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    const threshold = firstAvg * 0.1; // 10% change threshold

    if (Math.abs(diff) < threshold) return 'stable';
    
    // For most metrics, lower is better (except throughput)
    const isPositiveMetric = metricName === 'throughput';
    
    if (isPositiveMetric) {
      return diff > 0 ? 'improving' : 'degrading';
    } else {
      return diff < 0 ? 'improving' : 'degrading';
    }
  }

  // Get performance summary
  getSummary(): {
    totalNodes: number;
    healthyNodes: number;
    degradedNodes: number;
    unhealthyNodes: number;
    averageCpu: number;
    averageMemory: number;
    totalThroughput: number;
    averageErrorRate: number;
  } {
    const metrics = this.getAllMetrics();
    const healthChecks = Array.from(this.healthChecks.values());

    return {
      totalNodes: metrics.length,
      healthyNodes: healthChecks.filter(h => h.status === 'healthy').length,
      degradedNodes: healthChecks.filter(h => h.status === 'degraded').length,
      unhealthyNodes: healthChecks.filter(h => h.status === 'unhealthy').length,
      averageCpu: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length : 0,
      averageMemory: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length : 0,
      totalThroughput: metrics.reduce((sum, m) => sum + m.taskThroughput, 0),
      averageErrorRate: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length : 0,
    };
  }

  // Set alert thresholds
  setAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  // Run predictive analysis
  predictIssues(nodeId: string): {
    predictedIssues: string[];
    confidence: number;
    recommendedAction: string;
  } {
    const metrics = this.getMetrics(nodeId);
    if (!metrics) return { predictedIssues: [], confidence: 0, recommendedAction: 'none' };

    const issues: string[] = [];
    let confidence = 0;

    // Check trends
    const cpuTrend = this.calculateTrend(nodeId, 'cpu');
    const memoryTrend = this.calculateTrend(nodeId, 'memory');
    const errorTrend = this.calculateTrend(nodeId, 'error_rate');

    if (cpuTrend === 'degrading' && metrics.cpuUsage > 60) {
      issues.push('CPU usage trending upward, may exceed threshold soon');
      confidence += 0.3;
    }
    if (memoryTrend === 'degrading' && metrics.memoryUsage > 50) {
      issues.push('Memory usage trending upward, may exceed threshold soon');
      confidence += 0.3;
    }
    if (errorTrend === 'degrading' && metrics.errorRate > 2) {
      issues.push('Error rate increasing, potential service degradation');
      confidence += 0.4;
    }

    let recommendedAction = 'monitor';
    if (issues.length >= 2) {
      recommendedAction = 'scale_up';
    } else if (issues.length === 1) {
      recommendedAction = 'investigate';
    }

    return {
      predictedIssues: issues,
      confidence: Math.min(confidence, 1.0),
      recommendedAction,
    };
  }

  // Start monitoring loop
  private startMonitoringLoop(): void {
    setInterval(() => {
      this.cleanupOldMetrics();
      this.emit('monitoring:tick', { timestamp: Date.now() });
    }, 60000); // Every minute
  }

  // Cleanup old metrics
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.historyRetentionMs;
    this.metricHistory.forEach((history, key) => {
      const filtered = history.filter(m => m.timestamp > cutoff);
      this.metricHistory.set(key, filtered);
    });
  }

  // Dispose
  dispose(): void {
    this.removeAllListeners();
    this.metrics.clear();
    this.metricHistory.clear();
    this.healthChecks.clear();
  }
}
