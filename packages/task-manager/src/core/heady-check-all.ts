import { EventEmitter } from 'events';
import { createHash } from 'crypto';

/**
 * HeadyCheckAll Node - The Universal Verifier
 * 
 * Responsibilities:
 * 1. Execution Verification (Checkpoint Protocol)
 * 2. Performance Determinism (Golden Ratio timing)
 * 3. Operational Optimization (Comparison with best known)
 * 4. Active Notification (Divergence alerts)
 */

export interface Checkpoint {
  processId: string;
  stepId: string;
  timestamp: number;
  stateHash: string;
  metadata?: any;
}

export interface ProcessDefinition {
  id: string;
  steps: string[]; // Ordered list of step IDs
  expectedDuration?: number;
  deterministic: boolean;
}

export interface VerificationResult {
  processId: string;
  verified: boolean;
  divergence?: {
    type: 'sequence' | 'state' | 'timing';
    details: string;
  };
  latency: number;
}

export class HeadyCheckAllNode extends EventEmitter {
  private activeProcesses: Map<string, {
    definition: ProcessDefinition;
    checkpoints: Checkpoint[];
    startTime: number;
  }> = new Map();

  private knownDefinitions: Map<string, ProcessDefinition> = new Map();
  private shadowMode: boolean = true; // Default to true for data digestion
  
  // Golden Ratio for timing checks
  private readonly PHI = 1.618033988749895;

  constructor() {
    super();
  }

  setShadowMode(enabled: boolean): void {
    this.shadowMode = enabled;
    this.emit('mode:changed', { shadowMode: enabled });
  }

  isShadowMode(): boolean {
    return this.shadowMode;
  }

  /**
   * Register a known process definition for verification
   */
  registerProcess(definition: ProcessDefinition): void {
    this.knownDefinitions.set(definition.id, definition);
  }

  /**
   * Start tracking a process execution
   */
  startProcess(processId: string, definitionId: string): void {
    const definition = this.knownDefinitions.get(definitionId);
    if (!definition) {
      this.emit('alert', {
        level: 'WARNING',
        message: `Unknown process definition: ${definitionId}`,
        processId
      });
      return;
    }

    this.activeProcesses.set(processId, {
      definition,
      checkpoints: [],
      startTime: Date.now()
    });

    this.emit('process:started', { processId, definitionId });
  }

  /**
   * Record a checkpoint in the process execution
   */
  checkpoint(processId: string, stepId: string, state: any): VerificationResult {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      return {
        processId,
        verified: false,
        divergence: { type: 'sequence', details: 'Process not started or already finished' },
        latency: 0
      };
    }

    const timestamp = Date.now();
    const stateHash = this.hashState(state);
    
    // 1. Sequence Verification
    const currentStepIndex = process.checkpoints.length;
    const expectedStepId = process.definition.steps[currentStepIndex];
    
    if (expectedStepId !== stepId) {
      const divergence = {
        type: 'sequence' as const,
        details: `Expected step ${expectedStepId}, got ${stepId}`
      };
      
      // In Shadow Mode, we just record/learn (or emit info), we don't alarm as critically
      if (this.shadowMode) {
          this.emit('observation', { processId, divergence, type: 'sequence_mismatch' });
      } else {
          this.emit('divergence', { processId, ...divergence });
      }
      
      return { processId, verified: false, divergence, latency: timestamp - process.startTime };
    }

    // 2. Timing Verification (Phi-based if applicable)
    // If we have an expected duration for the previous step, we could check it here.
    // For now, we just record.

    process.checkpoints.push({
      processId,
      stepId,
      timestamp,
      stateHash,
      metadata: { statePreview: JSON.stringify(state).substring(0, 100) }
    });

    return {
      processId,
      verified: true,
      latency: timestamp - process.startTime
    };
  }

  /**
   * End process tracking and perform final verification
   */
  endProcess(processId: string, finalState: any): VerificationResult {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      return {
        processId,
        verified: false,
        divergence: { type: 'sequence', details: 'Process not active' },
        latency: 0
      };
    }

    const timestamp = Date.now();
    const duration = timestamp - process.startTime;

    // Verify all steps were completed
    if (process.checkpoints.length !== process.definition.steps.length) {
       const divergence = {
        type: 'sequence' as const,
        details: `Incomplete execution. Expected ${process.definition.steps.length} steps, got ${process.checkpoints.length}`
      };
      
      if (this.shadowMode) {
          this.emit('observation', { processId, divergence, type: 'incomplete_execution' });
      } else {
          this.emit('divergence', { processId, ...divergence });
      }

      this.activeProcesses.delete(processId);
      return { processId, verified: false, divergence, latency: duration };
    }

    // Performance Determinism Check
    if (process.definition.expectedDuration) {
      // Allow some variance, but check against Golden Ratio intervals?
      // Or simply check if it's within acceptable bounds.
      const deviation = Math.abs(duration - process.definition.expectedDuration);
      const percentDeviation = (deviation / process.definition.expectedDuration) * 100;
      
      if (percentDeviation > 20) { // Arbitrary threshold for now
         const alertData = {
          level: this.shadowMode ? 'INFO' : 'WARNING',
          message: `Process ${processId} timing deviation: ${percentDeviation.toFixed(2)}%`,
          processId
        };
        this.emit('alert', alertData);
      }
    }

    this.activeProcesses.delete(processId);
    
    this.emit('process:verified', { 
      processId, 
      duration, 
      checkpoints: process.checkpoints.length 
    });

    return {
      processId,
      verified: true,
      latency: duration
    };
  }

  private hashState(state: any): string {
    return createHash('sha256').update(JSON.stringify(state)).digest('hex');
  }

  /**
   * Generate a unique process ID
   */
  generateProcessId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
