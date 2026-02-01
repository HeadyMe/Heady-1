export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  process: {
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    cpu: number;
  };
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastCheck: number;
  responseTime?: number;
  errorCount: number;
  uptime: number;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  service?: string;
  resolved: boolean;
  resolvedAt?: number;
}

export interface Task {
    id: string;
    task: {
        type: string;
        description: string;
        priority: string;
    };
    status: string;
    progress: number;
    startedAt?: number;
    executionTime?: number;
}
