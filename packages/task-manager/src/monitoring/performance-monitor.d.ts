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
export declare class PerformanceMonitor extends EventEmitter {
    private metrics;
    private metricHistory;
    private healthChecks;
    private readonly historyRetentionMs;
    private alertThresholds;
    constructor();
    recordMetrics(metrics: PerformanceMetrics): void;
    private storeMetricHistory;
    private checkThresholds;
    recordHealthCheck(check: HealthCheck): void;
    getMetrics(nodeId: string): PerformanceMetrics | undefined;
    getAllMetrics(): PerformanceMetrics[];
    getMetricHistory(nodeId: string, metricName: string, durationMs?: number): MetricPoint[];
    getHealthCheck(nodeId: string): HealthCheck | undefined;
    calculateTrend(nodeId: string, metricName: string): 'improving' | 'stable' | 'degrading';
    getSummary(): {
        totalNodes: number;
        healthyNodes: number;
        degradedNodes: number;
        unhealthyNodes: number;
        averageCpu: number;
        averageMemory: number;
        totalThroughput: number;
        averageErrorRate: number;
    };
    setAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void;
    predictIssues(nodeId: string): {
        predictedIssues: string[];
        confidence: number;
        recommendedAction: string;
    };
    private startMonitoringLoop;
    private cleanupOldMetrics;
    dispose(): void;
}
//# sourceMappingURL=performance-monitor.d.ts.map