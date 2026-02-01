/**
 * Dynamic resource allocator for MCP task processing
 * Adjusts task concurrency based on system pressure and queue load.
 */

import { EventEmitter } from 'events';
import { monitoringService, SystemMetrics } from './monitoring-service.js';
import { taskQueue } from './task-queue.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

const numberFromEnv = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export interface ResourceAllocatorConfig {
  minConcurrent: number;
  maxConcurrent: number;
  cpuHighWatermark: number;
  cpuLowWatermark: number;
  memoryHighWatermark: number;
  memoryLowWatermark: number;
  scaleStep: number;
  cooldownMs: number;
  queuePressureThreshold: number;
}

export interface AllocationUpdate {
  previous: number;
  current: number;
  reason: string;
  cpuUsage: number;
  memoryUsage: number;
  queueLength: number;
  processing: number;
  timestamp: number;
}

export interface ResourceAllocatorStatus {
  isRunning: boolean;
  currentMaxConcurrent: number;
  minConcurrent: number;
  maxConcurrent: number;
  lastScaleAt: number | null;
  cooldownMs: number;
  queueLength: number;
  processing: number;
  cpuUsage: number | null;
  memoryUsage: number | null;
}

class ResourceAllocator extends EventEmitter {
  private config: ResourceAllocatorConfig;
  private isRunning = false;
  private lastScaleAt: number | null = null;
  private lastCpuUsage: number | null = null;
  private lastMemoryUsage: number | null = null;

  constructor(config?: Partial<ResourceAllocatorConfig>) {
    super();
    this.config = {
      minConcurrent: numberFromEnv('HC_QUEUE_MIN_CONCURRENT', 1),
      maxConcurrent: numberFromEnv('HC_QUEUE_MAX_CONCURRENT', 6),
      cpuHighWatermark: numberFromEnv('HC_QUEUE_CPU_HIGH', 85),
      cpuLowWatermark: numberFromEnv('HC_QUEUE_CPU_LOW', 55),
      memoryHighWatermark: numberFromEnv('HC_QUEUE_MEMORY_HIGH', 85),
      memoryLowWatermark: numberFromEnv('HC_QUEUE_MEMORY_LOW', 70),
      scaleStep: numberFromEnv('HC_QUEUE_SCALE_STEP', 1),
      cooldownMs: numberFromEnv('HC_QUEUE_SCALE_COOLDOWN_MS', 8000),
      queuePressureThreshold: numberFromEnv('HC_QUEUE_PRESSURE', 3),
      ...config,
    };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    monitoringService.on('metrics:collected', this.handleMetrics);
    logger.info('Resource allocator started', { config: this.config });
  }

  stop(): void {
    if (!this.isRunning) return;
    monitoringService.off('metrics:collected', this.handleMetrics);
    this.isRunning = false;
    logger.info('Resource allocator stopped');
  }

  getStatus(): ResourceAllocatorStatus {
    const queueStatus = taskQueue.getStatus();
    return {
      isRunning: this.isRunning,
      currentMaxConcurrent: queueStatus.maxConcurrent,
      minConcurrent: this.config.minConcurrent,
      maxConcurrent: this.config.maxConcurrent,
      lastScaleAt: this.lastScaleAt,
      cooldownMs: this.config.cooldownMs,
      queueLength: queueStatus.queueLength,
      processing: queueStatus.processing,
      cpuUsage: this.lastCpuUsage,
      memoryUsage: this.lastMemoryUsage,
    };
  }

  private handleMetrics = (systemMetrics: SystemMetrics): void => {
    const queueStatus = taskQueue.getStatus();
    const cpuUsage = systemMetrics.cpu.usage;
    const memoryUsage = systemMetrics.memory.usagePercent;

    this.lastCpuUsage = cpuUsage;
    this.lastMemoryUsage = memoryUsage;

    metrics.record('queue_length', queueStatus.queueLength);
    metrics.record('queue_processing', queueStatus.processing);
    metrics.record('queue_max_concurrent', queueStatus.maxConcurrent);

    const now = Date.now();
    if (this.lastScaleAt && now - this.lastScaleAt < this.config.cooldownMs) {
      return;
    }

    let desired = queueStatus.maxConcurrent;
    let reason = 'stable';

    const highPressure =
      cpuUsage >= this.config.cpuHighWatermark || memoryUsage >= this.config.memoryHighWatermark;
    const lowPressure =
      cpuUsage <= this.config.cpuLowWatermark && memoryUsage <= this.config.memoryLowWatermark;
    const queuePressure = queueStatus.queueLength >= this.config.queuePressureThreshold;

    if (highPressure) {
      desired = Math.max(this.config.minConcurrent, queueStatus.maxConcurrent - this.config.scaleStep);
      reason = 'high_pressure';
    } else if (lowPressure && queuePressure) {
      desired = Math.min(this.config.maxConcurrent, queueStatus.maxConcurrent + this.config.scaleStep);
      reason = 'queue_pressure';
    }

    if (desired === queueStatus.maxConcurrent) {
      return;
    }

    taskQueue.setMaxConcurrent(desired);
    this.lastScaleAt = now;

    const update: AllocationUpdate = {
      previous: queueStatus.maxConcurrent,
      current: desired,
      reason,
      cpuUsage,
      memoryUsage,
      queueLength: queueStatus.queueLength,
      processing: queueStatus.processing,
      timestamp: now,
    };

    logger.info('Resource allocation updated', update);
    metrics.record('queue_concurrency_adjustment', desired, { reason });
    this.emit('allocation:updated', update);
  };
}

export const resourceAllocator = new ResourceAllocator();
