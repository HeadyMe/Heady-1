import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPService {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  description: string;
}

export interface MCPRequest {
  method: string;
  params?: any;
}

export interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export class MCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private service: MCPService;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();

  constructor(service: MCPService) {
    super();
    this.service = service;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        ...this.service.env,
      };

      this.process = spawn(this.service.command, this.service.args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (!this.process.stdout || !this.process.stdin) {
        reject(new Error('Failed to create process streams'));
        return;
      }

      let buffer = '';
      this.process.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              this.handleResponse(response);
            } catch (e) {
              console.error(`[MCP ${this.service.name}] Parse error:`, e);
            }
          }
        }
      });

      this.process.stderr?.on('data', (data) => {
        console.error(`[MCP ${this.service.name}] Error:`, data.toString());
      });

      this.process.on('error', (error) => {
        console.error(`[MCP ${this.service.name}] Process error:`, error);
        reject(error);
      });

      this.process.on('exit', (code) => {
        console.log(`[MCP ${this.service.name}] Process exited with code ${code}`);
        this.process = null;
      });

      // Give the process a moment to start
      setTimeout(() => resolve(), 1000);
    });
  }

  async request(method: string, params?: any): Promise<any> {
    if (!this.process || !this.process.stdin) {
      throw new Error('MCP service not started');
    }

    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const requestStr = JSON.stringify(request) + '\n';
      this.process!.stdin!.write(requestStr);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  private handleResponse(response: any): void {
    const { id, result, error } = response;

    if (id && this.pendingRequests.has(id)) {
      const { resolve, reject } = this.pendingRequests.get(id)!;
      this.pendingRequests.delete(id);

      if (error) {
        reject(new Error(error.message || 'MCP request failed'));
      } else {
        resolve(result);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  isRunning(): boolean {
    return this.process !== null;
  }
}
