import { mcpManager } from './mcp-manager.js';

export type NodeName = 
  | 'BRIDGE' | 'MUSE' | 'SENTINEL' | 'NOVA' | 'OBSERVER' 
  | 'JANITOR' | 'JULES' | 'SOPHIA' | 'CIPHER' | 'ATLAS' 
  | 'MURPHY' | 'SASHA' | 'SCOUT' | 'OCULUS' | 'BUILDER' | 'FOREMAN';

export interface SystemNode {
  name: NodeName;
  capabilities: string[];
  primaryService?: string; // The preferred MCP service for this node
  fallbackService?: string; // Fallback MCP service
  description: string;
}

export class NodeRegistry {
  private nodes: Map<NodeName, SystemNode> = new Map();

  constructor() {
    this.initializeNodes();
  }

  private initializeNodes() {
    // Initialize nodes based on system configuration
    this.registerNode({
      name: 'BRIDGE',
      capabilities: ['mcp_server', 'network', 'tunnel'],
      primaryService: 'heady',
      description: 'System connectivity and context bridge'
    });

    this.registerNode({
      name: 'MUSE',
      capabilities: ['generate_content', 'marketing'],
      primaryService: 'jules', // Jules is good at creative writing too
      description: 'Creative content and marketing generation'
    });

    this.registerNode({
      name: 'SENTINEL',
      capabilities: ['verify_auth', 'security_audit'],
      primaryService: 'heady',
      description: 'Security and authentication verification'
    });

    this.registerNode({
      name: 'NOVA',
      capabilities: ['scan_gaps'],
      primaryService: 'heady',
      description: 'System optimization and gap analysis'
    });

    this.registerNode({
      name: 'JULES',
      capabilities: ['optimize', 'code_generation'],
      primaryService: 'jules',
      description: 'Code optimization and generation (Jules Hyper-Surgeon)'
    });

    this.registerNode({
      name: 'SOPHIA',
      capabilities: ['learn_tool', 'research'],
      primaryService: 'github-copilot', // Good for research/learning
      description: 'Knowledge acquisition and research'
    });

    this.registerNode({
      name: 'OCULUS',
      capabilities: ['visualize', 'browser_automation'],
      primaryService: 'playwright',
      description: 'Visualization and browser automation'
    });

    this.registerNode({
      name: 'SCOUT',
      capabilities: ['scan_github', 'snippet_management'],
      primaryService: 'github-gists',
      description: 'Code scouting and snippet management'
    });

     this.registerNode({
      name: 'ATLAS',
      capabilities: ['auto_doc', 'ml_inference'],
      primaryService: 'huggingface', // ML for docs/understanding
      description: 'Documentation and ML inference'
    });
    
    // Default/Placeholder nodes for others to ensure completeness
    this.registerNode({ name: 'OBSERVER', capabilities: ['monitor'], primaryService: 'heady', description: 'System monitoring' });
    this.registerNode({ name: 'JANITOR', capabilities: ['clean_sweep'], primaryService: 'heady', description: 'Cleanup and maintenance' });
    this.registerNode({ name: 'CIPHER', capabilities: ['obfuscate'], primaryService: 'heady', description: 'Encryption and obfuscation' });
    this.registerNode({ name: 'MURPHY', capabilities: ['security_audit'], primaryService: 'heady', description: 'Advanced security auditing' });
    this.registerNode({ name: 'SASHA', capabilities: ['brainstorm'], primaryService: 'jules', description: 'Brainstorming and ideation' });
    this.registerNode({ name: 'BUILDER', capabilities: ['new_project'], primaryService: 'jules', description: 'Project scaffolding' });
    this.registerNode({ name: 'FOREMAN', capabilities: ['consolidate', 'merge'], primaryService: 'heady', description: 'Process management' });
  }

  registerNode(node: SystemNode) {
    this.nodes.set(node.name, node);
  }

  getNode(name: NodeName): SystemNode | undefined {
    return this.nodes.get(name);
  }

  getAllNodes(): SystemNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Find the best node for a specific task type or capability
   */
  findNodeForCapability(capability: string): SystemNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.capabilities.includes(capability)) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Resolve which MCP service to use for a given Node
   */
  resolveServiceForNode(nodeName: NodeName): string {
    const node = this.nodes.get(nodeName);
    if (!node) {
        throw new Error(`Node ${nodeName} not found`);
    }

    // Check if primary service is available via MCP Manager
    // This is a simple check; in reality we might want to check health status
    if (node.primaryService) {
        return node.primaryService;
    }

    if (node.fallbackService) {
        return node.fallbackService;
    }

    throw new Error(`No service available for node ${nodeName}`);
  }
}

export const nodeRegistry = new NodeRegistry();
