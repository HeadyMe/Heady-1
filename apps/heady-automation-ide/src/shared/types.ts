/**
 * Shared TypeScript types for Heady Automation IDE
 * Used across client and server
 */

// Task Types
export type TaskType =
  | 'code_generation'
  | 'research'
  | 'browser_automation'
  | 'ml_inference'
  | 'snippet_management'
  | 'design_system';

export interface Task {
  type: TaskType;
  description: string;
  context?: Record<string, any>;
}

export interface TaskResult {
  success: boolean;
  result?: any;
  error?: string;
  service: string;
  executionTime: number;
}

// MCP Service Types
export interface MCPServiceInfo {
  name: string;
  description: string;
  status: 'available' | 'running' | 'stopped' | 'error';
  taskTypes: TaskType[];
}

export interface MCPServiceStatus {
  available: string[];
  running: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  service: string;
  mcp: MCPServiceStatus;
  uptime?: number;
  version?: string;
}

// Metrics Types
export interface ServiceMetrics {
  service: string;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

export interface SystemMetrics {
  uptime: number;
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  services: ServiceMetrics[];
}

// Queue Types
export interface QueueStatus {
  queueLength: number;
  processing: number;
  maxConcurrent: number;
  tasks: QueuedTaskInfo[];
}

export interface QueuedTaskInfo {
  id: string;
  type: TaskType;
  priority: number;
  waitTime: number;
}

// WebSocket Event Types
export type SocketEvent =
  | 'task:started'
  | 'task:progress'
  | 'task:completed'
  | 'task:failed'
  | 'mcp:service:started'
  | 'mcp:service:stopped'
  | 'system:health';

export interface SocketMessage<T = any> {
  event: SocketEvent;
  data: T;
  timestamp: number;
}

// Browser Automation Types
export interface ScreenshotRequest {
  url: string;
  interactive?: boolean;
  fullPage?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface ScreenshotResult {
  success: boolean;
  screenshot?: string; // base64 encoded
  error?: string;
}

// Configuration Types
export interface ServerConfig {
  port: number;
  env: 'development' | 'production' | 'test';
  corsOrigins: string[];
  apiKey?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// User/Auth Types (for future use)
export interface User {
  id: string;
  email: string;
  apiKey: string;
  createdAt: string;
}

export interface AuthRequest {
  apiKey: string;
}

// Error Types
export interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    details?: any;
  };
}
