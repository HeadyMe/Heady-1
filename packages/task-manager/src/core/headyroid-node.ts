/**
 * HeadyRoid Node - Intensive Processing Node for System Rebalancing
 * 
 * Activates when orchestration equilibrium is disrupted and requires
 * explicit user permission before download and activation.
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

export interface HeadyRoidConfig {
  maxCpuUsage: number;
  maxMemoryMb: number;
  maxDurationMs: number;
  autoShutdownOnBalance: boolean;
}

export interface EquilibriumMetrics {
  nodeLoadVariance: number;
  taskQueueDepth: number;
  errorRateSpike: number;
  responseTimeP95: number;
  timestamp: number;
}

export interface HeadyRoidPermission {
  granted: boolean;
  grantedAt?: number;
  expiresAt?: number;
  scope: 'single-use' | 'session' | 'persistent';
  constraints: {
    maxActivations?: number;
    maxDurationMs?: number;
    allowedTriggers?: string[];
  };
}

export class HeadyRoidNode extends EventEmitter {
  private config: HeadyRoidConfig;
  private active = false;
  private permission: HeadyRoidPermission | null = null;
  private activationCount = 0;
  private downloadedAt: number | null = null;
  private nodeHash: string | null = null;

  constructor(config: Partial<HeadyRoidConfig> = {}) {
    super();
    this.config = {
      maxCpuUsage: config.maxCpuUsage || 80,
      maxMemoryMb: config.maxMemoryMb || 2048,
      maxDurationMs: config.maxDurationMs || 300000,
      autoShutdownOnBalance: config.autoShutdownOnBalance ?? true,
    };
  }

  /**
   * Request user permission to download and activate HeadyRoid Node
   */
  async requestPermission(
    scope: 'single-use' | 'session' | 'persistent' = 'single-use',
    reason: string
  ): Promise<HeadyRoidPermission> {
    this.emit('permission:requested', { scope, reason });

    const permissionRequest = {
      nodeType: 'HeadyRoid',
      reason,
      scope,
      capabilities: [
        'Intensive CPU processing',
        'High memory allocation',
        'Task queue rebalancing',
        'Node load redistribution',
        'Emergency failover coordination',
      ],
      risks: [
        'Increased system resource usage',
        'Potential impact on other processes',
        'Network bandwidth for download',
      ],
      estimatedImpact: {
        cpu: `Up to ${this.config.maxCpuUsage}%`,
        memory: `Up to ${this.config.maxMemoryMb}MB`,
        duration: `Max ${this.config.maxDurationMs / 1000}s`,
      },
    };

    return new Promise((resolve, reject) => {
      this.emit('permission:prompt', permissionRequest);

      const timeout = setTimeout(() => {
        reject(new Error('Permission request timed out (no user response)'));
      }, 60000);

      this.once('permission:response', (response: { granted: boolean; constraints?: any }) => {
        clearTimeout(timeout);

        if (response.granted) {
          const now = Date.now();
          const permission: HeadyRoidPermission = {
            granted: true,
            grantedAt: now,
            expiresAt: scope === 'single-use' ? now + 3600000 : scope === 'session' ? now + 86400000 : undefined,
            scope,
            constraints: response.constraints || {
              maxActivations: scope === 'single-use' ? 1 : undefined,
              maxDurationMs: this.config.maxDurationMs,
            },
          };

          this.permission = permission;
          this.emit('permission:granted', permission);
          resolve(permission);
        } else {
          this.emit('permission:denied');
          reject(new Error('User denied HeadyRoid activation permission'));
        }
      });
    });
  }

  /**
   * Download HeadyRoid Node package (simulated)
   */
  async download(): Promise<void> {
    if (!this.permission?.granted) {
      throw new Error('Cannot download HeadyRoid without permission');
    }

    this.emit('download:started');

    const downloadSteps = [
      { step: 'Verifying signature', progress: 10 },
      { step: 'Downloading core module', progress: 30 },
      { step: 'Downloading processing algorithms', progress: 60 },
      { step: 'Validating integrity', progress: 80 },
      { step: 'Installing dependencies', progress: 95 },
      { step: 'Finalizing', progress: 100 },
    ];

    for (const { step, progress } of downloadSteps) {
      this.emit('download:progress', { step, progress });
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    this.downloadedAt = Date.now();
    this.nodeHash = this.generateNodeHash();

    this.emit('download:complete', {
      downloadedAt: this.downloadedAt,
      hash: this.nodeHash,
      size: '45.2MB',
    });
  }

  /**
   * Activate HeadyRoid Node for intensive processing
   */
  async activate(metrics: EquilibriumMetrics): Promise<void> {
    if (!this.permission?.granted) {
      throw new Error('Cannot activate HeadyRoid without permission');
    }

    if (!this.downloadedAt) {
      throw new Error('HeadyRoid must be downloaded before activation');
    }

    if (this.permission.expiresAt && Date.now() > this.permission.expiresAt) {
      throw new Error('Permission expired - request new permission');
    }

    if (
      this.permission.constraints.maxActivations &&
      this.activationCount >= this.permission.constraints.maxActivations
    ) {
      throw new Error('Maximum activations reached for this permission');
    }

    if (this.active) {
      throw new Error('HeadyRoid already active');
    }

    this.active = true;
    this.activationCount++;

    this.emit('activation:started', {
      activationCount: this.activationCount,
      metrics,
      timestamp: Date.now(),
    });

    const strategy = this.determineRebalancingStrategy(metrics);
    this.emit('rebalancing:strategy', strategy);

    if (this.config.autoShutdownOnBalance) {
      this.monitorEquilibrium();
    }
  }

  /**
   * Determine rebalancing strategy based on metrics
   */
  private determineRebalancingStrategy(metrics: EquilibriumMetrics): {
    priority: 'critical' | 'high' | 'medium';
    actions: string[];
    estimatedDuration: number;
  } {
    const actions: string[] = [];
    let priority: 'critical' | 'high' | 'medium' = 'medium';

    if (metrics.nodeLoadVariance > 0.5) {
      actions.push('Redistribute tasks across nodes');
      priority = 'high';
    }

    if (metrics.taskQueueDepth > 1000) {
      actions.push('Increase task processing parallelism');
      priority = 'critical';
    }

    if (metrics.errorRateSpike > 0.1) {
      actions.push('Isolate failing nodes');
      actions.push('Reroute tasks to healthy nodes');
      priority = 'critical';
    }

    if (metrics.responseTimeP95 > 5000) {
      actions.push('Optimize task routing algorithm');
      actions.push('Enable aggressive caching');
      priority = 'high';
    }

    const estimatedDuration = priority === 'critical' ? 60000 : priority === 'high' ? 120000 : 180000;

    return { priority, actions, estimatedDuration };
  }

  /**
   * Monitor equilibrium and auto-shutdown when balanced
   */
  private monitorEquilibrium(): void {
    const checkInterval = setInterval(() => {
      this.emit('equilibrium:check');

      this.once('equilibrium:metrics', (metrics: EquilibriumMetrics) => {
        const balanced = this.isSystemBalanced(metrics);

        if (balanced) {
          clearInterval(checkInterval);
          this.deactivate('equilibrium_restored');
        }
      });
    }, 5000);

    setTimeout(() => {
      clearInterval(checkInterval);
      if (this.active) {
        this.deactivate('max_duration_reached');
      }
    }, this.config.maxDurationMs);
  }

  /**
   * Check if system is balanced
   */
  private isSystemBalanced(metrics: EquilibriumMetrics): boolean {
    return (
      metrics.nodeLoadVariance < 0.2 &&
      metrics.taskQueueDepth < 100 &&
      metrics.errorRateSpike < 0.01 &&
      metrics.responseTimeP95 < 1000
    );
  }

  /**
   * Deactivate HeadyRoid Node
   */
  deactivate(reason: string): void {
    if (!this.active) return;

    this.active = false;

    this.emit('deactivation:complete', {
      reason,
      activationCount: this.activationCount,
      timestamp: Date.now(),
    });
  }

  /**
   * Revoke permission and cleanup
   */
  revokePermission(): void {
    if (this.active) {
      this.deactivate('permission_revoked');
    }

    this.permission = null;
    this.downloadedAt = null;
    this.nodeHash = null;
    this.activationCount = 0;

    this.emit('permission:revoked');
  }

  /**
   * Generate deterministic hash for downloaded node
   */
  private generateNodeHash(): string {
    const data = `headyroid-${this.downloadedAt}-${this.config.maxCpuUsage}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get current status
   */
  getStatus(): {
    active: boolean;
    permissionGranted: boolean;
    downloaded: boolean;
    activationCount: number;
    config: HeadyRoidConfig;
  } {
    return {
      active: this.active,
      permissionGranted: this.permission?.granted || false,
      downloaded: !!this.downloadedAt,
      activationCount: this.activationCount,
      config: this.config,
    };
  }
}
