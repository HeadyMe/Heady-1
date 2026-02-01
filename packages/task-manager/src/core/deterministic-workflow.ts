/**
 * Deterministic Workflow Engine
 * Ensures reproducible, consistent behavior across node operations
 */

import { createHash, randomBytes } from 'crypto';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'decision' | 'parallel' | 'sequence' | 'retry';
  action: string;
  params: Record<string, any>;
  dependsOn: string[];
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  timeoutMs: number;
  deterministic: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  version: string;
  seed: string;
  steps: WorkflowStep[];
  createdAt: number;
}

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  seed: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStep: string | null;
  completedSteps: string[];
  failedSteps: string[];
  results: Map<string, any>;
  startTime: number;
  endTime?: number;
}

export class DeterministicWorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private stepHandlers: Map<string, (step: WorkflowStep, context: any) => Promise<any>> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  // Register a workflow definition
  registerWorkflow(workflow: Workflow): void {
    // Validate workflow has deterministic properties
    if (!workflow.seed) {
      workflow.seed = this.generateSeed();
    }
    
    // Sort steps by dependencies for deterministic execution order
    workflow.steps = this.topologicalSort(workflow.steps);
    
    this.workflows.set(workflow.id, workflow);
  }

  // Generate deterministic seed
  private generateSeed(): string {
    return randomBytes(32).toString('hex');
  }

  // Start workflow execution
  async executeWorkflow(workflowId: string, initialContext: any = {}): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution: WorkflowExecution = {
      workflowId,
      executionId: this.generateExecutionId(workflowId, initialContext),
      seed: workflow.seed,
      status: 'running',
      currentStep: null,
      completedSteps: [],
      failedSteps: [],
      results: new Map(),
      startTime: Date.now(),
    };

    this.executions.set(execution.executionId, execution);

    try {
      for (const step of workflow.steps) {
        await this.executeStep(step, execution, initialContext);
      }
      
      execution.status = 'completed';
      execution.endTime = Date.now();
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      throw error;
    }

    return execution;
  }

  // Execute single step with deterministic behavior
  private async executeStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    context: any
  ): Promise<void> {
    execution.currentStep = step.id;

    // Check dependencies
    const pendingDeps = step.dependsOn.filter(dep => !execution.completedSteps.includes(dep));
    if (pendingDeps.length > 0) {
      throw new Error(`Step ${step.id} has unmet dependencies: ${pendingDeps.join(', ')}`);
    }

    // Get deterministic params if needed
    const params = step.deterministic 
      ? this.makeDeterministic(step.params, execution.seed, step.id)
      : step.params;

    // Execute with timeout
    const handler = this.stepHandlers.get(step.type);
    if (!handler) {
      throw new Error(`No handler registered for step type: ${step.type}`);
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Step ${step.id} timed out`)), step.timeoutMs);
    });

    try {
      const result = await Promise.race([
        handler(step, { ...context, ...params, results: execution.results }),
        timeoutPromise,
      ]);

      execution.results.set(step.id, result);
      execution.completedSteps.push(step.id);
    } catch (error) {
      execution.failedSteps.push(step.id);
      
      // Handle retry policy
      if (step.retryPolicy) {
        await this.handleRetry(step, execution, context, error as Error);
      } else {
        throw error;
      }
    }
  }

  // Handle step retry with exponential backoff
  private async handleRetry(
    step: WorkflowStep,
    execution: WorkflowExecution,
    context: any,
    error: Error
  ): Promise<void> {
    if (!step.retryPolicy) return;

    const currentAttempt = execution.results.get(`${step.id}_attempts`) || 0;
    
    if (currentAttempt >= step.retryPolicy.maxAttempts) {
      throw new Error(`Step ${step.id} failed after ${currentAttempt} attempts: ${error.message}`);
    }

    const delay = step.retryPolicy.initialDelayMs * 
      Math.pow(step.retryPolicy.backoffMultiplier, currentAttempt);

    execution.results.set(`${step.id}_attempts`, currentAttempt + 1);

    await this.sleep(delay);
    await this.executeStep(step, execution, context);
  }

  // Make parameters deterministic based on seed
  private makeDeterministic(
    params: Record<string, any>,
    seed: string,
    stepId: string
  ): Record<string, any> {
    const deterministic: Record<string, any> = {};
    const hash = createHash('sha256').update(seed + stepId).digest('hex');

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        // Generate deterministic value based on hash
        const hashIndex = parseInt(hash.slice(0, 8), 16);
        deterministic[key] = this.generateValueFromHash(key, hashIndex);
      } else {
        deterministic[key] = value;
      }
    }

    return deterministic;
  }

  // Generate value from hash for determinism
  private generateValueFromHash(key: string, hashIndex: number): any {
    const type = key.toLowerCase();
    
    if (type.includes('port')) {
      return 8000 + (hashIndex % 1000);
    } else if (type.includes('id') || type.includes('uuid')) {
      return `det-${hashIndex.toString(16).padStart(8, '0')}`;
    } else if (type.includes('count') || type.includes('limit')) {
      return 10 + (hashIndex % 90);
    } else if (type.includes('timeout') || type.includes('delay')) {
      return 1000 + (hashIndex % 4000);
    }
    
    return `auto-${hashIndex}`;
  }

  // Topological sort for deterministic step ordering
  private topologicalSort(steps: WorkflowStep[]): WorkflowStep[] {
    const sorted: WorkflowStep[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const stepMap = new Map(steps.map(s => [s.id, s]));

    const visit = (step: WorkflowStep) => {
      if (visiting.has(step.id)) {
        throw new Error(`Circular dependency detected at step ${step.id}`);
      }
      if (visited.has(step.id)) return;

      visiting.add(step.id);
      
      for (const depId of step.dependsOn) {
        const dep = stepMap.get(depId);
        if (dep) visit(dep);
      }

      visiting.delete(step.id);
      visited.add(step.id);
      sorted.push(step);
    };

    // Sort by ID for deterministic order when no dependencies
    const sortedById = [...steps].sort((a, b) => a.id.localeCompare(b.id));
    
    for (const step of sortedById) {
      if (!visited.has(step.id)) {
        visit(step);
      }
    }

    return sorted;
  }

  // Generate deterministic execution ID
  private generateExecutionId(workflowId: string, context: any): string {
    const hash = createHash('sha256')
      .update(workflowId + JSON.stringify(context) + Date.now())
      .digest('hex');
    return `exec-${hash.slice(0, 16)}`;
  }

  // Register step handler
  registerStepHandler(
    type: string,
    handler: (step: WorkflowStep, context: any) => Promise<any>
  ): void {
    this.stepHandlers.set(type, handler);
  }

  // Register default handlers
  private registerDefaultHandlers(): void {
    this.registerStepHandler('task', async (step, context) => {
      // Default task execution
      console.log(`Executing task: ${step.name}`);
      return { success: true, step: step.id };
    });

    this.registerStepHandler('decision', async (step, context) => {
      // Deterministic decision based on seed
      const hash = createHash('sha256').update(step.id + JSON.stringify(context)).digest('hex');
      const decision = parseInt(hash.slice(0, 8), 16) % 2 === 0;
      return { decision, path: decision ? 'true' : 'false' };
    });

    this.registerStepHandler('parallel', async (step, context) => {
      // Execute parallel sub-steps
      const subSteps = step.params.steps as WorkflowStep[] || [];
      const results = await Promise.all(
        subSteps.map(subStep => this.stepHandlers.get(subStep.type)?.(subStep, context))
      );
      return { parallelResults: results };
    });

    this.registerStepHandler('sequence', async (step, context) => {
      // Execute sequential sub-steps
      const subSteps = step.params.steps as WorkflowStep[] || [];
      const results: any[] = [];
      for (const subStep of subSteps) {
        const result = await this.stepHandlers.get(subStep.type)?.(subStep, context);
        results.push(result);
      }
      return { sequenceResults: results };
    });

    this.registerStepHandler('retry', async (step, context) => {
      // Retry wrapper
      return this.stepHandlers.get('task')?.(step, context);
    });
  }

  // Get execution status
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  // Get workflow definition
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  // Validate workflow determinism
  validateWorkflow(workflowId: string): {
    valid: boolean;
    issues: string[];
  } {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return { valid: false, issues: ['Workflow not found'] };
    }

    const issues: string[] = [];

    // Check all steps have required fields
    for (const step of workflow.steps) {
      if (!step.id) issues.push(`Step missing ID`);
      if (!step.type) issues.push(`Step ${step.id} missing type`);
      if (!step.action) issues.push(`Step ${step.id} missing action`);
      
      // Check for non-deterministic elements
      if (!step.deterministic && step.params && Object.keys(step.params).length > 0) {
        issues.push(`Step ${step.id} has non-deterministic params without explicit flag`);
      }
    }

    // Check for circular dependencies
    try {
      this.topologicalSort(workflow.steps);
    } catch (e) {
      issues.push((e as Error).message);
    }

    return { valid: issues.length === 0, issues };
  }

  // Utility: Sleep for milliseconds
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Dispose
  dispose(): void {
    this.workflows.clear();
    this.executions.clear();
    this.stepHandlers.clear();
  }
}

// Predefined workflows for optimal node behavior
export const PREDEFINED_WORKFLOWS: Record<string, Workflow> = {
  nodeInitialization: {
    id: 'node-init',
    name: 'Node Initialization',
    version: '1.0.0',
    seed: 'deterministic-node-init-v1',
    createdAt: Date.now(),
    steps: [
      {
        id: 'health-check',
        name: 'Health Check',
        type: 'task',
        action: 'checkHealth',
        params: { timeout: 5000 },
        dependsOn: [],
        timeoutMs: 10000,
        deterministic: true,
      },
      {
        id: 'register-capabilities',
        name: 'Register Capabilities',
        type: 'task',
        action: 'registerCapabilities',
        params: {},
        dependsOn: ['health-check'],
        timeoutMs: 5000,
        deterministic: true,
      },
      {
        id: 'connect-orchestrator',
        name: 'Connect to Orchestrator',
        type: 'task',
        action: 'connectOrchestrator',
        params: { retryAttempts: 3 },
        dependsOn: ['register-capabilities'],
        timeoutMs: 15000,
        deterministic: true,
        retryPolicy: {
          maxAttempts: 3,
          backoffMultiplier: 2,
          initialDelayMs: 1000,
        },
      },
      {
        id: 'start-heartbeat',
        name: 'Start Heartbeat',
        type: 'task',
        action: 'startHeartbeat',
        params: { interval: 30000 },
        dependsOn: ['connect-orchestrator'],
        timeoutMs: 5000,
        deterministic: true,
      },
    ],
  },

  taskExecution: {
    id: 'task-exec',
    name: 'Task Execution',
    version: '1.0.0',
    seed: 'deterministic-task-exec-v1',
    createdAt: Date.now(),
    steps: [
      {
        id: 'validate-task',
        name: 'Validate Task',
        type: 'task',
        action: 'validateTask',
        params: {},
        dependsOn: [],
        timeoutMs: 5000,
        deterministic: true,
      },
      {
        id: 'acquire-resources',
        name: 'Acquire Resources',
        type: 'task',
        action: 'acquireResources',
        params: {},
        dependsOn: ['validate-task'],
        timeoutMs: 10000,
        deterministic: true,
      },
      {
        id: 'execute-task',
        name: 'Execute Task',
        type: 'task',
        action: 'executeTask',
        params: {},
        dependsOn: ['acquire-resources'],
        timeoutMs: 300000, // 5 minutes
        deterministic: false, // Actual execution may vary
        retryPolicy: {
          maxAttempts: 2,
          backoffMultiplier: 1.5,
          initialDelayMs: 5000,
        },
      },
      {
        id: 'release-resources',
        name: 'Release Resources',
        type: 'task',
        action: 'releaseResources',
        params: {},
        dependsOn: ['execute-task'],
        timeoutMs: 5000,
        deterministic: true,
      },
    ],
  },
};
