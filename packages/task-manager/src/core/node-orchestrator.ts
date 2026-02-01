import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface NodeMessage {
  id: string;
  sourceNode: string;
  targetNode: string;
  type: MessageType;
  payload: any;
  timestamp: number;
  priority: number;
  correlationId?: string;
  ttl: number;
}

export enum MessageType {
  TASK_ASSIGN = 'TASK_ASSIGN',
  TASK_COMPLETE = 'TASK_COMPLETE',
  TASK_FAILED = 'TASK_FAILED',
  HEARTBEAT = 'HEARTBEAT',
  STATUS_UPDATE = 'STATUS_UPDATE',
  CAPABILITY_ANNOUNCE = 'CAPABILITY_ANNOUNCE',
  LOAD_BALANCE = 'LOAD_BALANCE',
  ERROR_REPORT = 'ERROR_REPORT',
  RECOVERY_REQUEST = 'RECOVERY_REQUEST',
  DETERMINISTIC_CHECK = 'DETERMINISTIC_CHECK',
}

export interface NodeCapabilities {
  nodeId: string;
  tools: string[];
  maxConcurrentTasks: number;
  currentLoad: number;
  latency: number;
  lastHeartbeat: number;
  status: NodeStatus;
  version: string;
}

export enum NodeStatus {
  ONLINE = 'ONLINE',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE',
  RECOVERING = 'RECOVERING',
}

export interface RoutingStrategy {
  type: 'round-robin' | 'least-loaded' | 'capability-match' | 'deterministic';
  weights?: Record<string, number>;
}

export class NodeOrchestrator extends EventEmitter {
  private nodes: Map<string, NodeCapabilities> = new Map();
  private messageQueue: NodeMessage[] = [];
  private messageHistory: Map<string, NodeMessage[]> = new Map();
  private routingTable: Map<string, string[]> = new Map();
  private readonly maxHistoryPerNode = 1000;
  private readonly heartbeatTimeout = 30000;
  private readonly messageTTL = 300000; // 5 minutes
  private deterministicSeed: string;
  private routingStrategy: RoutingStrategy;
  private maintenanceInterval: NodeJS.Timeout | null = null;

  constructor(seed?: string, strategy: RoutingStrategy = { type: 'capability-match' }) {
    super();
    this.deterministicSeed = seed || uuidv4();
    this.routingStrategy = strategy;
    this.startMaintenanceLoop();
  }

  // Register a node with the orchestrator
  registerNode(nodeId: string, capabilities: Partial<NodeCapabilities>): void {
    const fullCapabilities: NodeCapabilities = {
      nodeId,
      tools: capabilities.tools || [],
      maxConcurrentTasks: capabilities.maxConcurrentTasks || 5,
      currentLoad: 0,
      latency: 0,
      lastHeartbeat: Date.now(),
      status: NodeStatus.ONLINE,
      version: capabilities.version || '1.0.0',
    };

    this.nodes.set(nodeId, fullCapabilities);
    this.messageHistory.set(nodeId, []);
    this.emit('node:registered', { nodeId, capabilities: fullCapabilities });
    
    // Announce capabilities to other nodes
    this.broadcastMessage({
      id: uuidv4(),
      sourceNode: 'orchestrator',
      targetNode: '*',
      type: MessageType.CAPABILITY_ANNOUNCE,
      payload: { nodeId, capabilities: fullCapabilities },
      timestamp: Date.now(),
      priority: 10,
      ttl: this.messageTTL,
    });
  }

  // Unregister a node
  unregisterNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.messageHistory.delete(nodeId);
    this.emit('node:unregistered', { nodeId });
  }

  // Send message to specific node
  sendMessage(message: Omit<NodeMessage, 'id' | 'timestamp'>): string {
    const fullMessage: NodeMessage = {
      ...message,
      id: uuidv4(),
      timestamp: Date.now(),
    };

    // Store in history
    const history = this.messageHistory.get(message.sourceNode) || [];
    history.push(fullMessage);
    if (history.length > this.maxHistoryPerNode) {
      history.shift();
    }
    this.messageHistory.set(message.sourceNode, history);

    // Route message
    if (message.targetNode === '*') {
      this.broadcastMessage(fullMessage);
    } else {
      this.routeMessage(fullMessage);
    }

    return fullMessage.id;
  }

  // Broadcast message to all nodes
  private broadcastMessage(message: NodeMessage): void {
    this.nodes.forEach((_, nodeId) => {
      if (nodeId !== message.sourceNode) {
        this.emit('message', { ...message, targetNode: nodeId });
      }
    });
  }

  // Route message to specific node with optimization
  private routeMessage(message: NodeMessage): void {
    const targetNode = this.nodes.get(message.targetNode);
    
    if (!targetNode) {
      // Try to find alternative node
      const alternative = this.findAlternativeNode(message);
      if (alternative) {
        message.targetNode = alternative;
        this.emit('message:routed', { originalTarget: message.targetNode, newTarget: alternative });
      } else {
        this.emit('message:failed', { message, reason: 'Target node not found' });
        return;
      }
    }

    this.emit('message', message);
  }

  // Find best node for task based on routing strategy
  findBestNodeForTask(taskType: string, requiredTools: string[]): string | null {
    const availableNodes = Array.from(this.nodes.entries())
      .filter(([_, node]) => node.status === NodeStatus.ONLINE)
      .filter(([_, node]) => requiredTools.every(tool => node.tools.includes(tool)))
      .filter(([_, node]) => node.currentLoad < node.maxConcurrentTasks);

    if (availableNodes.length === 0) return null;

    switch (this.routingStrategy.type) {
      case 'least-loaded':
        return availableNodes.sort((a, b) => a[1].currentLoad - b[1].currentLoad)[0][0];
      
      case 'round-robin':
        const currentIndex = Math.floor(Date.now() / 1000) % availableNodes.length;
        return availableNodes[currentIndex][0];
      
      case 'deterministic':
        // Use seeded random for deterministic routing
        const hash = this.hashString(taskType + this.deterministicSeed);
        return availableNodes[hash % availableNodes.length][0];
      
      case 'capability-match':
      default:
        // Score nodes based on capabilities and load
        const scored = availableNodes.map(([id, node]) => ({
          id,
          score: (node.maxConcurrentTasks - node.currentLoad) * 100 - node.latency,
        }));
        return scored.sort((a, b) => b.score - a.score)[0]?.id || null;
    }
  }

  // Handle heartbeat from node
  handleHeartbeat(nodeId: string, metrics: Partial<NodeCapabilities>): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.lastHeartbeat = Date.now();
      node.currentLoad = metrics.currentLoad ?? node.currentLoad;
      node.latency = metrics.latency ?? node.latency;
      node.status = NodeStatus.ONLINE;
      this.emit('node:heartbeat', { nodeId, metrics });
    }
  }

  // Check node health and trigger recovery if needed
  private checkNodeHealth(): void {
    const now = Date.now();
    this.nodes.forEach((node, nodeId) => {
      const timeSinceHeartbeat = now - node.lastHeartbeat;
      
      if (timeSinceHeartbeat > this.heartbeatTimeout * 2) {
        node.status = NodeStatus.OFFLINE;
        this.emit('node:offline', { nodeId, timeSinceHeartbeat });
        this.triggerRecovery(nodeId);
      } else if (timeSinceHeartbeat > this.heartbeatTimeout) {
        node.status = NodeStatus.DEGRADED;
        this.emit('node:degraded', { nodeId, timeSinceHeartbeat });
      }
    });
  }

  // Trigger recovery for failed node
  private triggerRecovery(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Find nodes that can take over
    const recoveryNodes = Array.from(this.nodes.entries())
      .filter(([id, n]) => id !== nodeId && n.status === NodeStatus.ONLINE)
      .filter(([_, n]) => node.tools.every(tool => n.tools.includes(tool)));

    if (recoveryNodes.length > 0) {
      this.emit('recovery:initiated', { 
        failedNode: nodeId, 
        recoveryNodes: recoveryNodes.map(([id]) => id) 
      });
    }
  }

  // Find alternative node for failed message delivery
  private findAlternativeNode(message: NodeMessage): string | null {
    const requiredTools = this.inferRequiredTools(message);
    return this.findBestNodeForTask(message.type, requiredTools);
  }

  // Infer required tools from message type
  private inferRequiredTools(message: NodeMessage): string[] {
    const toolMap: Record<string, string[]> = {
      [MessageType.TASK_ASSIGN]: ['execute'],
      [MessageType.CAPABILITY_ANNOUNCE]: [],
      [MessageType.HEARTBEAT]: [],
      [MessageType.STATUS_UPDATE]: [],
      [MessageType.ERROR_REPORT]: ['log'],
      [MessageType.RECOVERY_REQUEST]: ['recover'],
    };
    return toolMap[message.type] || [];
  }

  // Seeded hash for deterministic behavior
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char + this.deterministicSeed.charCodeAt(i % this.deterministicSeed.length);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Get orchestrator stats
  getStats(): {
    totalNodes: number;
    onlineNodes: number;
    degradedNodes: number;
    offlineNodes: number;
    messageCount: number;
    averageLatency: number;
  } {
    const nodes = Array.from(this.nodes.values());
    const totalLatency = nodes.reduce((sum, node) => sum + node.latency, 0);
    
    return {
      totalNodes: nodes.length,
      onlineNodes: nodes.filter(n => n.status === NodeStatus.ONLINE).length,
      degradedNodes: nodes.filter(n => n.status === NodeStatus.DEGRADED).length,
      offlineNodes: nodes.filter(n => n.status === NodeStatus.OFFLINE).length,
      messageCount: Array.from(this.messageHistory.values()).reduce((sum, h) => sum + h.length, 0),
      averageLatency: nodes.length > 0 ? totalLatency / nodes.length : 0,
    };
  }

  // Set deterministic seed for reproducible behavior
  setDeterministicSeed(seed: string): void {
    this.deterministicSeed = seed;
    this.emit('config:changed', { deterministicSeed: seed });
  }

  // Update routing strategy
  setRoutingStrategy(strategy: RoutingStrategy): void {
    this.routingStrategy = strategy;
    this.emit('config:changed', { routingStrategy: strategy });
  }

  // Maintenance loop for cleanup and health checks
  private startMaintenanceLoop(): void {
    const interval = setInterval(() => {
      this.checkNodeHealth();
      this.cleanupExpiredMessages();
    }, 5000);
    this.maintenanceInterval = interval;
  }

  // Cleanup expired messages
  private cleanupExpiredMessages(): void {
    const now = Date.now();
    this.messageHistory.forEach((history, nodeId) => {
      const filtered = history.filter(msg => now - msg.timestamp < msg.ttl);
      this.messageHistory.set(nodeId, filtered);
    });
  }

  // Get node by ID
  getNode(nodeId: string): NodeCapabilities | undefined {
    return this.nodes.get(nodeId);
  }

  // Get all nodes
  getAllNodes(): NodeCapabilities[] {
    return Array.from(this.nodes.values());
  }

  // Dispose
  dispose(): void {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
    this.removeAllListeners();
    this.nodes.clear();
    this.messageQueue = [];
    this.messageHistory.clear();
  }
}
