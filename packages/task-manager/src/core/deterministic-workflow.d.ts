/**
 * Deterministic Workflow Engine
 * Ensures reproducible, consistent behavior across node operations
 */
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
export declare class DeterministicWorkflowEngine {
    private workflows;
    private executions;
    private stepHandlers;
    constructor();
    registerWorkflow(workflow: Workflow): void;
    private generateSeed;
    executeWorkflow(workflowId: string, initialContext?: any): Promise<WorkflowExecution>;
    private executeStep;
    private handleRetry;
    private makeDeterministic;
    private generateValueFromHash;
    private topologicalSort;
    private generateExecutionId;
    registerStepHandler(type: string, handler: (step: WorkflowStep, context: any) => Promise<any>): void;
    private registerDefaultHandlers;
    getExecution(executionId: string): WorkflowExecution | undefined;
    getWorkflow(workflowId: string): Workflow | undefined;
    validateWorkflow(workflowId: string): {
        valid: boolean;
        issues: string[];
    };
    private sleep;
    dispose(): void;
}
export declare const PREDEFINED_WORKFLOWS: Record<string, Workflow>;
//# sourceMappingURL=deterministic-workflow.d.ts.map