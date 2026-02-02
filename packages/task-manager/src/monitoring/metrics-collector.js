import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import { logger } from '../utils/logger.js';
export class MetricsCollector {
    registry;
    // Counters
    taskCreatedCounter;
    taskCompletedCounter;
    taskFailedCounter;
    // Gauges
    activeTasksGauge;
    queueSizeGauge;
    memoryUsageGauge;
    // Histograms
    taskDurationHistogram;
    queueWaitTimeHistogram;
    activeTasks = new Map();
    constructor() {
        this.registry = new Registry();
        this.initializeMetrics();
        this.startMemoryMonitoring();
    }
    initializeMetrics() {
        // Task counters
        this.taskCreatedCounter = new Counter({
            name: 'tasks_created_total',
            help: 'Total number of tasks created',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.taskCompletedCounter = new Counter({
            name: 'tasks_completed_total',
            help: 'Total number of tasks completed',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.taskFailedCounter = new Counter({
            name: 'tasks_failed_total',
            help: 'Total number of tasks failed',
            labelNames: ['type', 'error'],
            registers: [this.registry],
        });
        // Gauges
        this.activeTasksGauge = new Gauge({
            name: 'active_tasks',
            help: 'Number of currently active tasks',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.queueSizeGauge = new Gauge({
            name: 'queue_size',
            help: 'Current size of the task queue',
            labelNames: ['status'],
            registers: [this.registry],
        });
        this.memoryUsageGauge = new Gauge({
            name: 'memory_usage_bytes',
            help: 'Memory usage in bytes',
            labelNames: ['type'],
            registers: [this.registry],
        });
        // Histograms
        this.taskDurationHistogram = new Histogram({
            name: 'task_duration_seconds',
            help: 'Task execution duration in seconds',
            labelNames: ['type'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
            registers: [this.registry],
        });
        this.queueWaitTimeHistogram = new Histogram({
            name: 'queue_wait_time_seconds',
            help: 'Time spent waiting in queue in seconds',
            labelNames: ['type'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
            registers: [this.registry],
        });
    }
    startMemoryMonitoring() {
        setInterval(() => {
            const memUsage = process.memoryUsage();
            this.memoryUsageGauge.set({ type: 'heapTotal' }, memUsage.heapTotal);
            this.memoryUsageGauge.set({ type: 'heapUsed' }, memUsage.heapUsed);
            this.memoryUsageGauge.set({ type: 'rss' }, memUsage.rss);
            this.memoryUsageGauge.set({ type: 'external' }, memUsage.external);
        }, 10000); // Update every 10 seconds
    }
    recordTaskCreated(type) {
        this.taskCreatedCounter.inc({ type });
    }
    recordTaskStarted(taskId, type = 'unknown') {
        this.activeTasks.set(taskId, { type, startTime: Date.now() });
        this.activeTasksGauge.inc({ type });
    }
    recordTaskCompleted(taskId, type, duration) {
        this.taskCompletedCounter.inc({ type });
        const taskInfo = this.activeTasks.get(taskId);
        if (taskInfo) {
            this.activeTasks.delete(taskId);
            this.activeTasksGauge.dec({ type: taskInfo.type });
            // Record duration in seconds
            this.taskDurationHistogram.observe({ type }, duration / 1000);
        }
    }
    recordTaskFailed(taskId, type, error) {
        const errorType = this.categorizeError(error);
        this.taskFailedCounter.inc({ type, error: errorType });
        const taskInfo = this.activeTasks.get(taskId);
        if (taskInfo) {
            this.activeTasks.delete(taskId);
            this.activeTasksGauge.dec({ type: taskInfo.type });
        }
    }
    recordQueueMetrics(metrics) {
        this.queueSizeGauge.set({ status: 'waiting' }, metrics.waiting);
        this.queueSizeGauge.set({ status: 'active' }, metrics.active);
        this.queueSizeGauge.set({ status: 'completed' }, metrics.completed);
        this.queueSizeGauge.set({ status: 'failed' }, metrics.failed);
        this.queueSizeGauge.set({ status: 'delayed' }, metrics.delayed);
        this.queueSizeGauge.set({ status: 'paused' }, metrics.paused);
    }
    recordQueueWaitTime(type, waitTime) {
        this.queueWaitTimeHistogram.observe({ type }, waitTime / 1000);
    }
    categorizeError(error) {
        if (error.includes('timeout'))
            return 'timeout';
        if (error.includes('network'))
            return 'network';
        if (error.includes('validation'))
            return 'validation';
        if (error.includes('permission') || error.includes('auth'))
            return 'auth';
        if (error.includes('rate limit'))
            return 'rate_limit';
        if (error.includes('resource'))
            return 'resource';
        return 'other';
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    async getMetricsAsJSON() {
        const metrics = await this.registry.getMetricsAsJSON();
        return metrics;
    }
    getSummary() {
        return {
            activeTasks: this.activeTasks.size,
            taskTypes: Array.from(new Set(Array.from(this.activeTasks.values()).map(t => t.type))),
        };
    }
    reset() {
        this.registry.resetMetrics();
        this.activeTasks.clear();
        logger.info('Metrics collector reset');
    }
}
//# sourceMappingURL=metrics-collector.js.map