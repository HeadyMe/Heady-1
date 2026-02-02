/**
 * Equilibrium Detector - Monitors system balance and triggers HeadyRoid when needed
 */

import { EventEmitter } from 'events';
import type { EquilibriumMetrics } from './headyroid-node.js';

export interface EquilibriumThresholds {
  nodeLoadVariance: number;
  taskQueueDepth: number;
  errorRateSpike: number;
  responseTimeP95: number;
}

export interface EquilibriumState {
  balanced: boolean;
  severity: 'normal' | 'warning' | 'critical';
  metrics: EquilibriumMetrics;
  violations: string[];
}

export class EquilibriumDetector extends EventEmitter {
  private thresholds: EquilibriumThresholds;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastState: EquilibriumState | null = null;

  constructor(thresholds: Partial<EquilibriumThresholds> = {}) {
    super();
    this.thresholds = {
      nodeLoadVariance: thresholds.nodeLoadVariance || 0.3,
      taskQueueDepth: thresholds.taskQueueDepth || 500,
      errorRateSpike: thresholds.errorRateSpike || 0.05,
      responseTimeP95: thresholds.responseTimeP95 || 2000,
    };
  }

  /**
   * Start monitoring equilibrium
   */
  startMonitoring(intervalMs: number = 10000): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(() => {
      this.checkEquilibrium();
    }, intervalMs);

    this.emit('monitoring:started', { intervalMs });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.emit('monitoring:stopped');
    }
  }

  /**
   * Check current equilibrium state
   */
  async checkEquilibrium(): Promise<EquilibriumState> {
    this.emit('equilibrium:checking');

    return new Promise((resolve) => {
      this.once('metrics:collected', (metrics: EquilibriumMetrics) => {
        const state = this.analyzeMetrics(metrics);
        
        if (this.hasStateChanged(state)) {
          this.lastState = state;
          this.emit('equilibrium:state_changed', state);

          if (!state.balanced && state.severity === 'critical') {
            this.emit('equilibrium:critical', {
              state,
              recommendation: 'Activate HeadyRoid Node for rebalancing',
            });
          }
        }

        resolve(state);
      });

      this.emit('metrics:request');
    });
  }

  /**
   * Analyze metrics and determine equilibrium state
   */
  private analyzeMetrics(metrics: EquilibriumMetrics): EquilibriumState {
    const violations: string[] = [];
    let severity: 'normal' | 'warning' | 'critical' = 'normal';

    if (metrics.nodeLoadVariance > this.thresholds.nodeLoadVariance) {
      violations.push(`Node load variance ${metrics.nodeLoadVariance.toFixed(2)} exceeds threshold ${this.thresholds.nodeLoadVariance}`);
      severity = metrics.nodeLoadVariance > this.thresholds.nodeLoadVariance * 2 ? 'critical' : 'warning';
    }

    if (metrics.taskQueueDepth > this.thresholds.taskQueueDepth) {
      violations.push(`Task queue depth ${metrics.taskQueueDepth} exceeds threshold ${this.thresholds.taskQueueDepth}`);
      severity = metrics.taskQueueDepth > this.thresholds.taskQueueDepth * 2 ? 'critical' : severity === 'critical' ? 'critical' : 'warning';
    }

    if (metrics.errorRateSpike > this.thresholds.errorRateSpike) {
      violations.push(`Error rate spike ${(metrics.errorRateSpike * 100).toFixed(2)}% exceeds threshold ${(this.thresholds.errorRateSpike * 100).toFixed(2)}%`);
      severity = 'critical';
    }

    if (metrics.responseTimeP95 > this.thresholds.responseTimeP95) {
      violations.push(`P95 response time ${metrics.responseTimeP95}ms exceeds threshold ${this.thresholds.responseTimeP95}ms`);
      severity = metrics.responseTimeP95 > this.thresholds.responseTimeP95 * 2 ? 'critical' : severity === 'critical' ? 'critical' : 'warning';
    }

    return {
      balanced: violations.length === 0,
      severity,
      metrics,
      violations,
    };
  }

  /**
   * Check if state has meaningfully changed
   */
  private hasStateChanged(newState: EquilibriumState): boolean {
    if (!this.lastState) return true;
    
    return (
      this.lastState.balanced !== newState.balanced ||
      this.lastState.severity !== newState.severity ||
      this.lastState.violations.length !== newState.violations.length
    );
  }

  /**
   * Calculate node load variance
   */
  static calculateNodeLoadVariance(nodeLoads: number[]): number {
    if (nodeLoads.length === 0) return 0;

    const mean = nodeLoads.reduce((sum, load) => sum + load, 0) / nodeLoads.length;
    const variance = nodeLoads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / nodeLoads.length;
    
    return Math.sqrt(variance) / (mean || 1);
  }

  /**
   * Get current thresholds
   */
  getThresholds(): EquilibriumThresholds {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<EquilibriumThresholds>): void {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds,
    };
    this.emit('thresholds:updated', this.thresholds);
  }
}
