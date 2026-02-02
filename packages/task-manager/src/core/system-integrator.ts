/**
 * System Integration Module
 * Orchestrates all components for optimal node connectivity and performance
 */

import { EventEmitter } from 'events';
import { TaskManager } from './task-manager.js';
import { NodeOrchestrator } from './node-orchestrator.js';
import { PerformanceMonitor } from '../monitoring/performance-monitor.js';
import { DeterministicWorkflowEngine, PREDEFINED_WORKFLOWS } from './deterministic-workflow.js';
import { OptimizedTaskRouter } from './optimized-task-router.js';
import { NodeCommunicationProtocol, PROTOCOL_CONSTANTS } from './communication-protocol.js';
import { ArenaManager } from './arena-manager.js';
import { readFileSync } from 'fs';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import 'dotenv/config';

import { GovernanceClient } from './governance-client.js';

export interface SystemConfig {
  // Database
  databaseUrl: string;
  
  // Determinism
  deterministicSeed?: string;
  
  // Governance
  governanceUrl?: string;
  enableGovernance?: boolean;
  
  // Monitoring
  enableMonitoring?: boolean;
  monitoringInterval?: number;
  
  // Performance
  maxConcurrentTasks?: number;
  taskTimeoutMs?: number;
  
  // Protocol
  protocolPort?: number;
  enableCompression?: boolean;
  
  // Node registry
  nodeRegistryPath?: string;
  
  // Prompts
  promptsPath?: string;

  // Arena
  enableArena?: boolean;
}

export interface SystemStatus {
  initialized: boolean;
  running: boolean;
  nodes: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
  };
  tasks: {
    queued: number;
    active: number;
    completed: number;
    failed: number;
  };
  performance: {
    cpuAverage: number;
    memoryAverage: number;
    throughput: number;
    errorRate: number;
  };
  protocol: {
    messagesSent: number;
    messagesReceived: number;
    pendingAcks: number;
  };
  arena?: {
      activeMatches: number;
  };
}

export class SystemIntegrator extends EventEmitter {
  private config: Required<SystemConfig>;
  private taskManager!: TaskManager;
  private orchestrator!: NodeOrchestrator;
  private monitor!: PerformanceMonitor;
  private workflowEngine!: DeterministicWorkflowEngine;
  private router!: OptimizedTaskRouter;
  private protocol!: NodeCommunicationProtocol;
  private arenaManager!: ArenaManager;
  private governance!: GovernanceClient;
  private nodeRegistry: any = null;
  private prompts: any = null;
  private running = false;
  private statusInterval: NodeJS.Timeout | null = null;

  constructor(config: SystemConfig) {
    super();
    
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    // Calculate paths relative to the compiled file location (dist/core/system-integrator.js)
    // Root is ../../../../
    const projectRoot = path.resolve(currentDir, '../../../../');
    
    this.config = {
      databaseUrl: config.databaseUrl,
      deterministicSeed: config.deterministicSeed || this.generateSeed(),
      enableMonitoring: config.enableMonitoring ?? true,
      monitoringInterval: config.monitoringInterval || 30000,
      maxConcurrentTasks: config.maxConcurrentTasks || 100,
      taskTimeoutMs: config.taskTimeoutMs || 300000,
      protocolPort: config.protocolPort || PROTOCOL_CONSTANTS.DEFAULT_PORT,
      enableCompression: config.enableCompression ?? true,
      nodeRegistryPath: config.nodeRegistryPath || path.join(projectRoot, 'Heady/HeadyAcademy/Node_Registry.yaml'),
      promptsPath: config.promptsPath || path.join(projectRoot, 'packages/task-manager/src/core/deterministic-prompts.yaml'),
      enableArena: config.enableArena ?? true,
      governanceUrl: config.governanceUrl || 'http://localhost:8787',
      enableGovernance: config.enableGovernance ?? true,
    };
  }

  // Initialize the entire system
  async initialize(): Promise<void> {
    this.emit('system:initializing');

    try {
      // Load configuration files
      await this.loadConfigurations();

      // Initialize Governance Client
      if (this.config.enableGovernance) {
        this.governance = new GovernanceClient(this.config.governanceUrl);
        await this.checkGovernanceStandards();
      }

      // Initialize protocol layer
      this.protocol = new NodeCommunicationProtocol({
        enableCompression: this.config.enableCompression,
      });
      this.setupProtocolHandlers();

      // Initialize workflow engine
      this.workflowEngine = new DeterministicWorkflowEngine();
      this.registerPredefinedWorkflows();

      // Initialize orchestrator
      this.orchestrator = new NodeOrchestrator(
        this.config.deterministicSeed,
        { type: 'capability-match' }
      );
      this.setupOrchestratorHandlers();

      // Initialize performance monitor
      this.monitor = new PerformanceMonitor();
      this.setupMonitorHandlers();
      
      // Initialize Arena Manager
      if (this.config.enableArena) {
          this.arenaManager = new ArenaManager(this.orchestrator);
          this.setupArenaHandlers();
      }

      // Initialize task manager
      this.taskManager = new TaskManager({
        queue: {
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD
          },
          concurrency: this.config.maxConcurrentTasks,
          maxRetries: 3,
          retryDelay: 1000
        },
        database: {
          connectionString: this.config.databaseUrl
        },
        monitoring: {
          enabled: this.config.enableMonitoring,
          interval: this.config.monitoringInterval
        },
        maxConcurrentTasks: this.config.maxConcurrentTasks,
        deterministicSeed: this.config.deterministicSeed
      });

      // Initialize router (requires other components)
      this.router = new OptimizedTaskRouter(
        this.orchestrator,
        this.monitor,
        this.workflowEngine
      );
      this.setupRouterHandlers();

      // Start task manager
      try {
        await this.taskManager.initialize();
      } catch (error) {
        console.warn('⚠️ Task Manager failed to initialize (Database might be offline). System running in degraded mode.');
        this.emit('system:warning', { source: 'TaskManager', message: 'Initialization failed', error });
      }

      // Register nodes from registry
      await this.registerNodesFromRegistry();

      // Start status reporting
      if (this.config.enableMonitoring) {
        this.startStatusReporting();
      }

      this.emit('system:initialized');
    } catch (error) {
      this.emit('system:error', error);
      throw error;
    }
  }

  // Load configuration files
  private async loadConfigurations(): Promise<void> {
    try {
      // Load node registry
      const registryPath = resolve(this.config.nodeRegistryPath);
      const registryContent = readFileSync(registryPath, 'utf8');
      this.nodeRegistry = yaml.load(registryContent);

      // Load deterministic prompts
      const promptsPath = resolve(this.config.promptsPath);
      const promptsContent = readFileSync(promptsPath, 'utf8');
      this.prompts = yaml.load(promptsContent);

      this.emit('config:loaded', {
        nodes: this.nodeRegistry?.nodes?.length || 0,
        prompts: Object.keys(this.prompts?.node_prompts || {}).length,
      });
    } catch (error) {
      this.emit('config:error', error);
      // Continue without optional configs
    }
  }

  // Register predefined workflows
  private registerPredefinedWorkflows(): void {
    Object.values(PREDEFINED_WORKFLOWS).forEach(workflow => {
      this.workflowEngine.registerWorkflow(workflow);
    });
  }

  // Register nodes from registry
  private async registerNodesFromRegistry(): Promise<void> {
    if (!this.nodeRegistry?.nodes) return;

    for (const nodeDef of this.nodeRegistry.nodes) {
      const capabilities: any = {
        tools: [],
        maxConcurrentTasks: 5,
        version: '1.0.0',
      };

      // Map node tools from registry and MCP config
      if (this.prompts?.node_tools?.[nodeDef.name]) {
        capabilities.tools = this.prompts.node_tools[nodeDef.name];
      }

      // Apply node-specific prompt constraints
      const nodePrompt = this.prompts?.node_prompts?.[nodeDef.name];
      if (nodePrompt?.constraints) {
        if (nodePrompt.constraints.max_connections_per_cycle) {
          capabilities.maxConcurrentTasks = nodePrompt.constraints.max_connections_per_cycle;
        }
      }

      this.orchestrator.registerNode(nodeDef.name, capabilities);
      
      // Execute initialization workflow
      await this.workflowEngine.executeWorkflow('node-init', {
        nodeId: nodeDef.name,
        capabilities,
      });
    }

    this.emit('nodes:registered', { count: this.nodeRegistry.nodes.length });
  }

  // Setup protocol event handlers
  private setupProtocolHandlers(): void {
    this.protocol.on('message:outgoing', (msg) => {
      this.emit('protocol:outgoing', msg);
    });

    this.protocol.on('message:received', (msg) => {
      this.emit('protocol:incoming', msg);
    });

    this.protocol.on('heartbeat', ({ nodeId, status }) => {
      this.orchestrator.handleHeartbeat(nodeId, status);
    });

    this.protocol.on('recovery:request', (msg) => {
      this.handleRecoveryRequest(msg);
    });
  }

  // Setup orchestrator event handlers
  private setupOrchestratorHandlers(): void {
    this.orchestrator.on('node:registered', ({ nodeId }) => {
      this.emit('node:joined', { nodeId });
    });

    this.orchestrator.on('node:offline', ({ nodeId }) => {
      this.emit('node:left', { nodeId });
    });

    this.orchestrator.on('message', (msg) => {
      // Route to appropriate handler
      this.protocol.receive(msg);
    });
  }

  // Setup monitor event handlers
  private setupMonitorHandlers(): void {
    this.monitor.on('alert', (alert) => {
      this.emit('performance:alert', alert);
      
      // Auto-remediate if possible
      if (alert.severity === 'critical') {
        this.handleCriticalAlert(alert);
      }
    });

    this.monitor.on('performance:prediction', (prediction) => {
      this.emit('performance:prediction', prediction);
    });
  }

  // Setup arena event handlers
  private setupArenaHandlers(): void {
    if (!this.arenaManager) return;

    this.arenaManager.on('MATCH_STARTED', (event) => {
      this.emit('arena:match_started', event);
    });

    this.arenaManager.on('MATCH_COMPLETE', (event) => {
      this.emit('arena:match_complete', event);
    });
  }

  // Setup router event handlers
  private setupRouterHandlers(): void {
    this.router.on('task:assigned', ({ taskId, nodeId }) => {
      this.emit('task:assigned', { taskId, nodeId });
    });

    this.router.on('task:completed', (result) => {
      this.emit('task:completed', result);
    });

    this.router.on('routing:backpressure', ({ taskId, reason }) => {
      this.emit('system:backpressure', { taskId, reason });
    });
  }

  // Handle critical performance alerts
  private handleCriticalAlert(alert: any): void {
    switch (alert.nodeId) {
      case alert.nodeId:
        // Find alternative nodes for new tasks
        this.emit('system:failover', { 
          nodeId: alert.nodeId, 
          action: 'rerouting_new_tasks' 
        });
        break;
    }
  }

  // Handle recovery requests
  private handleRecoveryRequest(msg: any): void {
    const { source, payload } = msg;
    
    // Find recovery nodes
    const recoveryNodes = this.orchestrator.getAllNodes()
      .filter(n => n.status === 'ONLINE')
      .filter(n => n.nodeId !== source);

    if (recoveryNodes.length > 0) {
      // Send recovery response
      const response = this.protocol.createMessage(
        'system',
        source,
        'RECOVERY_RESPONSE' as any,
        {
          availableNodes: recoveryNodes.map(n => n.nodeId),
        }
      );
      
      this.protocol.send(response);
    }
  }

  // Check and apply governance standards
  private async checkGovernanceStandards(): Promise<void> {
    try {
      const standards = await this.governance.getStandards();
      this.emit('governance:standards_loaded', { count: standards.length });
      
      // Initial compliance check
      await this.reportCompliance();
    } catch (error) {
      console.warn('⚠️ Governance check failed (Worker might be offline)');
    }
  }

  // Generate and submit compliance report
  async reportCompliance(): Promise<void> {
    if (!this.governance) return;

    const health = await this.healthCheck();
    
    const report = {
      systemId: 'heady-core-v1',
      timestamp: Date.now(),
      standardsVersion: '1.0.0',
      overallScore: health.healthy ? 100 : 50, // Simplified score logic
      results: health.checks.map(c => ({
        standardId: 'std_system_health', // Mapping generic health to standard
        compliant: c.status === 'pass',
        issues: c.status !== 'pass' ? [c.message] : [],
        score: c.status === 'pass' ? 100 : 0
      }))
    };

    try {
      await this.governance.submitComplianceReport(report);
      this.emit('governance:compliance_reported');
    } catch (error) {
      // Silent fail for non-critical reporting
    }
  }

  getTaskManager(): TaskManager {
    return this.taskManager;
  }

  getArenaManager(): ArenaManager | undefined {
    return this.arenaManager;
  }

  // Start status reporting
  private startStatusReporting(): void {
    this.statusInterval = setInterval(() => {
      const status = this.getStatus();
      this.emit('system:status', status);
    }, this.config.monitoringInterval);
  }

  // Submit task through the optimized system
  async submitTask(taskData: {
    type: string;
    name: string;
    payload?: any;
    priority?: number;
    requiredTools?: string[];
    deterministic?: boolean;
    targetNode?: string;
  }): Promise<string> {
    if (!this.taskManager) {
      throw new Error('System not initialized');
    }

    return this.taskManager.submitTask(taskData);
  }

  // Get current system status
  getStatus(): SystemStatus {
    const nodeStats = this.orchestrator?.getStats();
    const taskStats = this.router?.getStats();
    const perfStats = this.monitor?.getSummary();
    const protocolStats = this.protocol?.getStats();

    return {
      initialized: !!this.taskManager,
      running: this.running,
      nodes: {
        total: nodeStats?.totalNodes || 0,
        online: nodeStats?.onlineNodes || 0,
        degraded: nodeStats?.degradedNodes || 0,
        offline: nodeStats?.offlineNodes || 0,
      },
      tasks: {
        queued: taskStats?.queuedTasks || 0,
        active: taskStats?.activeTasks || 0,
        completed: taskStats?.completedTasks || 0,
        failed: taskStats?.failedTasks || 0,
      },
      performance: {
        cpuAverage: perfStats?.averageCpu || 0,
        memoryAverage: perfStats?.averageMemory || 0,
        throughput: perfStats?.totalThroughput || 0,
        errorRate: perfStats?.averageErrorRate || 0,
      },
      protocol: {
        messagesSent: protocolStats?.sequenceNumber || 0,
        messagesReceived: 0, // Would track separately
        pendingAcks: protocolStats?.pendingMessages || 0,
      },
    };
  }

  // Generate deterministic seed
  private generateSeed(): string {
    return `heady-system-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  // Start the system
  async start(): Promise<void> {
    if (this.running) return;
    
    this.running = true;
    this.emit('system:started');
  }

  // Stop the system gracefully
  async stop(): Promise<void> {
    this.running = false;
    
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }

    await this.taskManager?.shutdown();
    this.protocol?.dispose();
    this.router?.dispose();
    this.orchestrator?.dispose();
    this.monitor?.dispose();
    this.workflowEngine?.dispose();

    this.emit('system:stopped');
  }

  // Get node capabilities
  getNodeCapabilities(nodeId: string): any {
    return this.orchestrator?.getNode(nodeId);
  }

  // Get deterministic prompt for node
  getNodePrompt(nodeId: string): any {
    return this.prompts?.node_prompts?.[nodeId];
  }

  // Validate system health
  async healthCheck(): Promise<{
    healthy: boolean;
    checks: { name: string; status: 'pass' | 'fail' | 'warn'; message: string }[];
  }> {
    const checks: { name: string; status: 'pass' | 'fail' | 'warn'; message: string }[] = [];

    // Check database
    try {
      const stats = await this.taskManager?.getStats();
      checks.push({
        name: 'database',
        status: 'pass',
        message: `Connected, ${stats?.total} tasks in database`,
      });
    } catch (error) {
      checks.push({
        name: 'database',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check nodes
    const nodeStats = this.orchestrator?.getStats();
    checks.push({
      name: 'nodes',
      status: nodeStats && nodeStats.onlineNodes > 0 ? 'pass' : 'warn',
      message: `${nodeStats?.onlineNodes || 0}/${nodeStats?.totalNodes || 0} nodes online`,
    });

    // Check performance
    const perfStats = this.monitor?.getSummary();
    checks.push({
      name: 'performance',
      status: (perfStats?.averageErrorRate || 0) < 5 ? 'pass' : 'warn',
      message: `Error rate: ${perfStats?.averageErrorRate?.toFixed(2) || 0}%`,
    });

    return {
      healthy: checks.every(c => c.status !== 'fail'),
      checks,
    };
  }
}

// Export system configuration helper
export function createSystemConfig(
  databaseUrl: string,
  overrides: Partial<SystemConfig> = {}
): SystemConfig {
  return {
    databaseUrl,
    ...overrides,
  };
}

// CLI Entry Point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const command = args[0];

  // Construct DATABASE_URL from components if not present
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    const dbUser = process.env.POSTGRES_USER || 'heady';
    const dbPass = process.env.POSTGRES_PASSWORD || 'heady123';
    const dbHost = process.env.POSTGRES_HOST || 'localhost';
    const dbPort = process.env.POSTGRES_PORT || '5432';
    const dbName = process.env.POSTGRES_DB || 'headysystems_dev';
    dbUrl = `postgres://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
  }

  const config = createSystemConfig(dbUrl);
  const system = new SystemIntegrator(config);

  (async () => {
    try {
      // Initialize system for all commands
      await system.initialize();

      switch (command) {
        case '--init':
          console.log('✅ System initialized successfully');
          break;

        case '--status':
          console.log(JSON.stringify(system.getStatus(), null, 2));
          break;

        case '--health':
          const health = await system.healthCheck();
          console.log(JSON.stringify(health, null, 2));
          if (!health.healthy) process.exit(1);
          break;
          
        case '--optimize':
          console.log('Running optimization...');
          // Trigger optimization logic
          break;
          
        case '--optimize-performance':
          console.log('Optimizing performance...');
          break;

        case '--monitor':
          console.log('Starting system monitor (Press Ctrl+C to exit)...');
          setInterval(async () => {
            const status = system.getStatus();
            console.clear();
            console.log('==========================================');
            console.log('       HEADY SYSTEM MONITOR               ');
            console.log('==========================================');
            console.log(`Time: ${new Date().toISOString()}`);
            console.log(`Status: ${status.running ? 'RUNNING' : 'STOPPED'}`);
            console.log('');
            console.log('Nodes:');
            console.log(`  Total: ${status.nodes.total}`);
            console.log(`  Online: ${status.nodes.online}`);
            console.log(`  Degraded: ${status.nodes.degraded}`);
            console.log(`  Offline: ${status.nodes.offline}`);
            console.log('');
            console.log('Tasks:');
            console.log(`  Active: ${status.tasks.active}`);
            console.log(`  Queued: ${status.tasks.queued}`);
            console.log(`  Completed: ${status.tasks.completed}`);
            console.log(`  Failed: ${status.tasks.failed}`);
            console.log('');
            console.log('Performance:');
            console.log(`  CPU: ${status.performance.cpuAverage.toFixed(1)}%`);
            console.log(`  Memory: ${status.performance.memoryAverage.toFixed(1)}%`);
            console.log(`  Throughput: ${status.performance.throughput}/sec`);
            console.log(`  Error Rate: ${status.performance.errorRate.toFixed(2)}%`);
            console.log('==========================================');
          }, 1000);
          // Keep process alive
          await new Promise(() => {});
          break;

        case '--arena-create':
           if (!system.getArenaManager()) {
               console.error('❌ Arena Manager not enabled');
               process.exit(1);
           }
           const matchId = await system.getArenaManager()!.createMatch({
               name: args[1] || 'Arena Match'
           });
           console.log(`✅ Match created: ${matchId}`);
           break;
           
        case '--arena-list':
           // Not fully implemented in ArenaManager yet, but placeholder
           console.log('Listing matches...');
           break;
           
        case '--arena-status':
           const id = args[1];
           if (!id) {
               console.error('❌ Missing match ID');
               process.exit(1);
           }
           const status = await system.getArenaManager()?.getMatchStatus(id);
           if (status) {
               console.log(JSON.stringify(status, null, 2));
           } else {
               console.error('❌ Match not found');
               process.exit(1);
           }
           break;

        default:
          console.error(`Unknown command: ${command}`);
          console.log('Available commands: --init, --status, --health, --optimize, --arena-create, --arena-status');
          process.exit(1);
      }
      
      // Allow time for async events/logs
      setTimeout(() => process.exit(0), 500);
      
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}
