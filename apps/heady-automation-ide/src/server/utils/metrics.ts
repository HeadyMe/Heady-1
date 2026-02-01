/**
 * Metrics collection and monitoring for Heady Automation IDE
 * Tracks performance, usage, and health metrics
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  uptime: number;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private serviceHealth = new Map<string, ServiceHealth>();
  private requestTimings = new Map<string, number[]>();
  private maxMetricsRetention = 1000;
  private startTime = Date.now();

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsRetention) {
      this.metrics.shift();
    }
  }

  /**
   * Record request timing
   */
  recordRequestTiming(endpoint: string, duration: number): void {
    if (!this.requestTimings.has(endpoint)) {
      this.requestTimings.set(endpoint, []);
    }

    const timings = this.requestTimings.get(endpoint)!;
    timings.push(duration);

    // Keep only last 100 timings per endpoint
    if (timings.length > 100) {
      timings.shift();
    }

    this.record('request_duration', duration, { endpoint });
  }

  /**
   * Record MCP service activity
   */
  recordMCPActivity(service: string, operation: string, duration: number, success: boolean): void {
    this.record('mcp_operation_duration', duration, {
      service,
      operation,
      status: success ? 'success' : 'failure',
    });

    // Update service health
    const health = this.serviceHealth.get(service) || {
      service,
      status: 'healthy',
      lastCheck: Date.now(),
      uptime: 0,
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
    };

    health.requestCount++;
    if (!success) {
      health.errorCount++;
    }
    health.lastCheck = Date.now();

    // Update average response time
    const timings = this.requestTimings.get(`mcp:${service}`) || [];
    timings.push(duration);
    if (timings.length > 100) timings.shift();
    this.requestTimings.set(`mcp:${service}`, timings);

    health.avgResponseTime = timings.reduce((a, b) => a + b, 0) / timings.length;

    // Determine health status
    const errorRate = health.errorCount / health.requestCount;
    if (errorRate > 0.5 || health.avgResponseTime > 10000) {
      health.status = 'unhealthy';
    } else if (errorRate > 0.2 || health.avgResponseTime > 5000) {
      health.status = 'degraded';
    } else {
      health.status = 'healthy';
    }

    this.serviceHealth.set(service, health);
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string, since?: number): Metric[] {
    const cutoff = since || Date.now() - 3600000; // Last hour by default
    return this.metrics.filter((m) => m.name === name && m.timestamp >= cutoff);
  }

  /**
   * Get all service health statuses
   */
  getServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }

  /**
   * Get health for a specific service
   */
  getServiceHealthStatus(service: string): ServiceHealth | undefined {
    return this.serviceHealth.get(service);
  }

  /**
   * Get average response time for an endpoint
   */
  getAverageResponseTime(endpoint: string): number {
    const timings = this.requestTimings.get(endpoint);
    if (!timings || timings.length === 0) return 0;
    return timings.reduce((a, b) => a + b, 0) / timings.length;
  }

  /**
   * Get percentile response time
   */
  getPercentileResponseTime(endpoint: string, percentile: number): number {
    const timings = this.requestTimings.get(endpoint);
    if (!timings || timings.length === 0) return 0;

    const sorted = [...timings].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index] || 0;
  }

  /**
   * Get system uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    uptime: number;
    totalRequests: number;
    totalErrors: number;
    avgResponseTime: number;
    services: ServiceHealth[];
  } {
    const services = this.getServiceHealth();
    const totalRequests = services.reduce((sum, s) => sum + s.requestCount, 0);
    const totalErrors = services.reduce((sum, s) => sum + s.errorCount, 0);

    // Calculate overall average response time
    const allTimings = Array.from(this.requestTimings.values()).flat();
    const avgResponseTime =
      allTimings.length > 0 ? allTimings.reduce((a, b) => a + b, 0) / allTimings.length : 0;

    return {
      uptime: this.getUptime(),
      totalRequests,
      totalErrors,
      avgResponseTime,
      services,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.serviceHealth.clear();
    this.requestTimings.clear();
    this.startTime = Date.now();
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // System uptime
    lines.push(`# HELP heady_uptime_seconds System uptime in seconds`);
    lines.push(`# TYPE heady_uptime_seconds gauge`);
    lines.push(`heady_uptime_seconds ${this.getUptime() / 1000}`);

    // Service health
    lines.push(`# HELP heady_service_health Service health status (1=healthy, 0.5=degraded, 0=unhealthy)`);
    lines.push(`# TYPE heady_service_health gauge`);
    for (const health of this.serviceHealth.values()) {
      const value = health.status === 'healthy' ? 1 : health.status === 'degraded' ? 0.5 : 0;
      lines.push(`heady_service_health{service="${health.service}"} ${value}`);
    }

    // Request counts
    lines.push(`# HELP heady_requests_total Total number of requests`);
    lines.push(`# TYPE heady_requests_total counter`);
    for (const health of this.serviceHealth.values()) {
      lines.push(`heady_requests_total{service="${health.service}"} ${health.requestCount}`);
    }

    // Error counts
    lines.push(`# HELP heady_errors_total Total number of errors`);
    lines.push(`# TYPE heady_errors_total counter`);
    for (const health of this.serviceHealth.values()) {
      lines.push(`heady_errors_total{service="${health.service}"} ${health.errorCount}`);
    }

    // Response times
    lines.push(`# HELP heady_response_time_ms Average response time in milliseconds`);
    lines.push(`# TYPE heady_response_time_ms gauge`);
    for (const health of this.serviceHealth.values()) {
      lines.push(`heady_response_time_ms{service="${health.service}"} ${health.avgResponseTime}`);
    }

    return lines.join('\n');
  }
}

// Singleton instance
export const metrics = new MetricsCollector();
