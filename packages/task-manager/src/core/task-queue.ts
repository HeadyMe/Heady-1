import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority, TaskEvent } from '../types/task.types.js';
import { logger } from '../utils/logger.js';

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  concurrency: number;
  maxRetries: number;
  retryDelay: number;
}

export class TaskQueue extends EventEmitter {
  private queue: Queue;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents;
  private connection: Redis;
  private executors: Map<string, Function> = new Map();
  private activeJobs: Map<string, Job> = new Map();

  constructor(
    private name: string,
    private config: QueueConfig
  ) {
    super();
    
    this.connection = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue(name, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: config.retryDelay,
        },
        removeOnComplete: {
          age: 24 * 3600, // 24 hours
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // 7 days
        },
      },
    });

    this.queueEvents = new QueueEvents(name, {
      connection: this.connection.duplicate(),
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.queueEvents.on('waiting', ({ jobId }) => {
      this.emit('task:queued', { taskId: jobId, event: 'queued' });
    });

    this.queueEvents.on('active', ({ jobId }) => {
      this.emit('task:started', { taskId: jobId, event: 'started' });
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      this.emit('task:progress', { taskId: jobId, event: 'progress', data });
    });

    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      this.activeJobs.delete(jobId);
      this.emit('task:completed', { taskId: jobId, event: 'completed', data: returnvalue });
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.activeJobs.delete(jobId);
      this.emit('task:failed', { taskId: jobId, event: 'failed', data: failedReason });
    });

    this.queueEvents.on('removed', ({ jobId }) => {
      this.activeJobs.delete(jobId);
    });
  }

  registerExecutor(type: string, executor: Function): void {
    this.executors.set(type, executor);
    logger.info(`Registered executor for task type: ${type}`);
  }

  async enqueue(task: Partial<Task>): Promise<string> {
    const taskId = task.id || uuidv4();
    const taskData = {
      ...task,
      id: taskId,
      status: TaskStatus.QUEUED,
      createdAt: new Date(),
      attempts: 0,
    };

    const priority = task.priority || TaskPriority.NORMAL;
    
    const job = await this.queue.add(
      task.type || 'default',
      taskData,
      {
        jobId: taskId,
        priority,
        delay: task.scheduledFor ? 
          new Date(task.scheduledFor).getTime() - Date.now() : 
          undefined,
      }
    );

    this.activeJobs.set(taskId, job);
    
    this.emit('task:created', { 
      taskId, 
      event: 'created',
      timestamp: new Date(),
      data: taskData 
    });

    logger.info(`Task ${taskId} enqueued`, { type: task.type, priority });
    return taskId;
  }

  async start(): Promise<void> {
    if (this.worker) {
      logger.warn('Worker already started');
      return;
    }

    this.worker = new Worker(
      this.name,
      async (job: Job) => {
        const task = job.data as Task;
        const executor = this.executors.get(task.type);

        if (!executor) {
          throw new Error(`No executor registered for task type: ${task.type}`);
        }

        logger.info(`Executing task ${task.id}`, { type: task.type });
        
        try {
          const result = await executor(task.payload, task, {
            updateProgress: (progress: number) => {
              job.updateProgress(progress);
            },
          });
          
          return result;
        } catch (error) {
          logger.error(`Task ${task.id} failed`, error);
          throw error;
        }
      },
      {
        connection: this.connection.duplicate(),
        concurrency: this.config.concurrency,
        autorun: true,
      }
    );

    this.worker.on('error', (error) => {
      logger.error('Worker error', error);
      this.emit('worker:error', error);
    });

    logger.info(`Task queue worker started with concurrency: ${this.config.concurrency}`);
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    await this.queueEvents.close();
    await this.queue.close();
    await this.connection.quit();
    logger.info('Task queue stopped');
  }

  async getTask(taskId: string): Promise<Job | null> {
    const job = await this.queue.getJob(taskId);
    return job || null;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const job = await this.getTask(taskId);
    if (!job) return false;

    await job.remove();
    this.emit('task:cancelled', { 
      taskId, 
      event: 'cancelled',
      timestamp: new Date() 
    });
    
    return true;
  }

  async retryTask(taskId: string): Promise<boolean> {
    const job = await this.getTask(taskId);
    if (!job) return false;

    await job.retry();
    this.emit('task:retried', { 
      taskId, 
      event: 'retried',
      timestamp: new Date() 
    });
    
    return true;
  }

  async getStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    const counts = await this.queue.getJobCounts(
      'waiting',
      'active', 
      'completed',
      'failed',
      'delayed',
      'paused'
    );
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0
    };
  }

  async getMetrics(): Promise<{
    throughput: number;
    errorRate: number;
    avgWaitTime: number;
    avgProcessTime: number;
  }> {
    const completed = await this.queue.getCompleted(0, 100);
    const failed = await this.queue.getFailed(0, 100);
    
    const totalJobs = completed.length + failed.length;
    const errorRate = totalJobs > 0 ? failed.length / totalJobs : 0;
    
    let totalWaitTime = 0;
    let totalProcessTime = 0;
    
    for (const job of completed) {
      if (job.processedOn && job.timestamp) {
        totalWaitTime += job.processedOn - job.timestamp;
        totalProcessTime += (job.finishedOn || job.processedOn) - job.processedOn;
      }
    }
    
    const avgWaitTime = completed.length > 0 ? totalWaitTime / completed.length : 0;
    const avgProcessTime = completed.length > 0 ? totalProcessTime / completed.length : 0;
    
    // Calculate throughput (jobs per minute)
    const timeRange = 60000; // 1 minute in ms
    const recentCompleted = completed.filter(
      job => job.finishedOn && (Date.now() - job.finishedOn) < timeRange
    );
    const throughput = (recentCompleted.length / timeRange) * 60000;
    
    return {
      throughput,
      errorRate,
      avgWaitTime,
      avgProcessTime,
    };
  }

  async clearCompleted(): Promise<void> {
    const jobs = await this.queue.getCompleted();
    await Promise.all(jobs.map(job => job.remove()));
    logger.info(`Cleared ${jobs.length} completed jobs`);
  }

  async clearFailed(): Promise<void> {
    const jobs = await this.queue.getFailed();
    await Promise.all(jobs.map(job => job.remove()));
    logger.info(`Cleared ${jobs.length} failed jobs`);
  }
}
