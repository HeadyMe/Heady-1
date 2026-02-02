import { MCPClient, MCPService } from './mcp-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MCPConfig {
  mcpServers: Record<string, MCPService>;
}

export class MCPManager {
  private clients = new Map<string, MCPClient>();
  private config: MCPConfig | null = null;

  async loadConfig(): Promise<void> {
    const configPath = path.resolve(__dirname, '../../../../../.mcp/config.json');
    
    if (!fs.existsSync(configPath)) {
      console.warn('MCP config not found at:', configPath);
      return;
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(configContent);
    
    console.log(`✅ Loaded MCP config with ${Object.keys(this.config!.mcpServers).length} services`);
  }

  async startService(serviceName: string): Promise<void> {
    if (!this.config) {
      throw new Error('MCP config not loaded');
    }

    if (this.clients.has(serviceName)) {
      console.log(`MCP service ${serviceName} already running`);
      return;
    }

    const serviceConfig = this.config.mcpServers[serviceName];
    if (!serviceConfig) {
      throw new Error(`MCP service ${serviceName} not found in config`);
    }

    // Substitute environment variables in service config
    const env: Record<string, string> = {};
    if (serviceConfig.env) {
      for (const [key, value] of Object.entries(serviceConfig.env)) {
        // Replace ${VAR} with actual env var
        const match = value.match(/^\$\{(.+)\}$/);
        if (match) {
          const envVar = match[1];
          env[key] = process.env[envVar] || '';
        } else {
          env[key] = value;
        }
      }
    }

    const service: MCPService = {
      ...serviceConfig,
      name: serviceName,
      env,
    };

    const client = new MCPClient(service);
    
    try {
      await client.start();
      this.clients.set(serviceName, client);
      console.log(`✅ Started MCP service: ${serviceName}`);
    } catch (error) {
      console.error(`Failed to start MCP service ${serviceName}:`, error);
      throw error;
    }
  }

  async stopService(serviceName: string): Promise<void> {
    const client = this.clients.get(serviceName);
    if (client) {
      await client.stop();
      this.clients.delete(serviceName);
      console.log(`Stopped MCP service: ${serviceName}`);
    }
  }

  async stopAll(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((name) => this.stopService(name));
    await Promise.all(promises);
  }

  getClient(serviceName: string): MCPClient | undefined {
    return this.clients.get(serviceName);
  }

  listServices(): string[] {
    return this.config ? Object.keys(this.config.mcpServers) : [];
  }

  getRunningServices(): string[] {
    return Array.from(this.clients.keys());
  }

  async executeTask(serviceName: string, method: string, params?: any): Promise<any> {
    let client = this.clients.get(serviceName);
    
    // Auto-start service if not running
    if (!client) {
      await this.startService(serviceName);
      client = this.clients.get(serviceName);
    }

    if (!client) {
      throw new Error(`Failed to start MCP service: ${serviceName}`);
    }

    return await client.request(method, params);
  }

  async listTools(serviceName: string): Promise<any> {
    // Standard MCP method for listing tools
    const response = await this.executeTask(serviceName, 'tools/list');
    return response.tools || [];
  }

  async callTool(serviceName: string, toolName: string, args: any): Promise<any> {
    // Standard MCP method for calling tools
    const response = await this.executeTask(serviceName, 'tools/call', {
      name: toolName,
      arguments: args
    });
    return response;
  }
}

// Singleton instance
export const mcpManager = new MCPManager();
