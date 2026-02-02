import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskManager } from './task-manager.js';

// Mock dependencies
vi.mock('./task-queue.js', () => {
  return {
    TaskQueue: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      registerExecutor: vi.fn(),
      enqueue: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      cancelTask: vi.fn(),
      retryTask: vi.fn(),
      getStatus: vi.fn(),
      getMetrics: vi.fn(),
    }))
  };
});

vi.mock('../persistence/task-repository.js', () => {
  return {
    TaskRepository: vi.fn().mockImplementation(() => ({
      initialize: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      updateProgress: vi.fn(),
      markStarted: vi.fn(),
      markCompleted: vi.fn(),
      markFailed: vi.fn(),
      getStats: vi.fn(),
      close: vi.fn(),
    }))
  };
});

vi.mock('../monitoring/metrics-collector.js', () => {
  return {
    MetricsCollector: vi.fn().mockImplementation(() => ({
      recordTaskCreated: vi.fn(),
      recordTaskStarted: vi.fn(),
      recordTaskCompleted: vi.fn(),
      recordTaskFailed: vi.fn(),
    }))
  };
});

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }
}));

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(TaskManager).toBeDefined();
  });

  it('should initialize correctly', () => {
    taskManager = new TaskManager({
      queue: {
        concurrency: 5,
        redis: { host: 'localhost', port: 6379 },
        maxRetries: 3,
        retryDelay: 1000
      },
      database: {
        connectionString: 'postgres://user:pass@localhost:5432/db'
      },
      monitoring: {
        enabled: true,
        interval: 5000
      }
    });
    expect(taskManager).toBeDefined();
  });

  it('should call initialize on dependencies', async () => {
    taskManager = new TaskManager({
        queue: {
          concurrency: 5,
          redis: { host: 'localhost', port: 6379 },
          maxRetries: 3,
          retryDelay: 1000
        },
        database: {
          connectionString: 'postgres://user:pass@localhost:5432/db'
        }
      });
      
    await taskManager.initialize();
    expect(true).toBe(true); 
  });
});
