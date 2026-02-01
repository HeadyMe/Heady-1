import { mcpManager } from './mcp-manager.js';
import { nodeRegistry, NodeName } from './node-registry.js';

export interface Task {
  type: 'code_generation' | 'research' | 'browser_automation' | 'ml_inference' | 'snippet_management' | 'design_system';
  description: string;
  context?: any;
}

export interface TaskResult {
  success: boolean;
  result?: any;
  error?: string;
  service: string;
  node?: string;
  executionTime: number;
}

export class TaskRouter {
  /**
   * Prepare task execution parameters without executing
   */
  prepareTaskExecution(task: Task) {
    const nodeName = this.getNodeForTask(task);
    const service = nodeRegistry.resolveServiceForNode(nodeName);
    
    return {
      node: nodeName,
      service: service,
      method: this.getMethodForTask(task),
      params: this.getParamsForTask(task)
    };
  }

  /**
   * Route a task to the appropriate System Node based on task type
   */
  private getNodeForTask(task: Task): NodeName {
    switch (task.type) {
      case 'code_generation':
        return 'JULES';
      
      case 'research':
        return 'SOPHIA';
      
      case 'browser_automation':
        return 'OCULUS';
      
      case 'ml_inference':
        return 'ATLAS';
      
      case 'snippet_management':
        return 'SCOUT';
      
      case 'design_system':
        // BRIDGE provides access to Core Heady services like Phi tokens
        return 'BRIDGE';
      
      default:
        return 'JULES';
    }
  }

  /**
   * Execute a task using the appropriate Node and MCP service
   */
  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    let service = 'unknown';
    let nodeName: NodeName | undefined;

    try {
      nodeName = this.getNodeForTask(task);
      service = nodeRegistry.resolveServiceForNode(nodeName);

      console.log(`🚀 Routing task [${task.type}] via Node [${nodeName}] to Service: ${service}`);
      
      // Build the MCP request based on task type
      const method = this.getMethodForTask(task);
      const params = this.getParamsForTask(task);

      const result = await mcpManager.executeTask(service, method, params);
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Task completed in ${executionTime}ms`);
      
      return {
        success: true,
        result,
        service,
        node: nodeName,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Task failed after ${executionTime}ms:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        service,
        node: nodeName ? nodeName : 'unknown',
        executionTime,
      };
    }
  }

  /**
   * Get the MCP method name for a task
   */
  private getMethodForTask(task: Task): string {
    switch (task.type) {
      case 'code_generation':
        return 'generate_code';
      case 'research':
        return 'search';
      case 'browser_automation':
        return 'execute_script';
      case 'ml_inference':
        return 'inference';
      case 'snippet_management':
        return 'create_gist';
      case 'design_system':
        return 'generate_phi_tokens';
      default:
        return 'execute';
    }
  }

  /**
   * Build parameters for the MCP request
   */
  private getParamsForTask(task: Task): any {
    return {
      description: task.description,
      context: task.context,
      ...task.context,
    };
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeBatch(tasks: Task[]): Promise<TaskResult[]> {
    const promises = tasks.map((task) => this.executeTask(task));
    return await Promise.all(promises);
  }

  /**
   * Get available MCP services
   */
  getAvailableServices(): string[] {
    return mcpManager.listServices();
  }

  /**
   * Get currently running MCP services
   */
  getRunningServices(): string[] {
    return mcpManager.getRunningServices();
  }
}

// Singleton instance
export const taskRouter = new TaskRouter();
