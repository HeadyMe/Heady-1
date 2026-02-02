export declare class MetricsCollector {
    private registry;
    private taskCreatedCounter;
    private taskCompletedCounter;
    private taskFailedCounter;
    private activeTasksGauge;
    private queueSizeGauge;
    private memoryUsageGauge;
    private taskDurationHistogram;
    private queueWaitTimeHistogram;
    private activeTasks;
    constructor();
    private initializeMetrics;
    private startMemoryMonitoring;
    recordTaskCreated(type: string): void;
    recordTaskStarted(taskId: string, type?: string): void;
    recordTaskCompleted(taskId: string, type: string, duration: number): void;
    recordTaskFailed(taskId: string, type: string, error: string): void;
    recordQueueMetrics(metrics: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: number;
    }): void;
    recordQueueWaitTime(type: string, waitTime: number): void;
    private categorizeError;
    getMetrics(): Promise<string>;
    getMetricsAsJSON(): Promise<import("prom-client").MetricObjectWithValues<import("prom-client").MetricValue<string>>[]>;
    getSummary(): {
        activeTasks: number;
        taskTypes: string[];
    };
    reset(): void;
}
//# sourceMappingURL=metrics-collector.d.ts.map