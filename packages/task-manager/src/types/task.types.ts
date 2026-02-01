import { z } from 'zod';

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export enum TaskPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

export const TaskSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  name: z.string(),
  description: z.string().optional(),
  payload: z.any(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  attempts: z.number().default(0),
  maxRetries: z.number().default(3),
  progress: z.number().min(0).max(100).default(0),
  result: z.any().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  scheduledFor: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  parentTaskId: z.string().uuid().optional(),
  childTaskIds: z.array(z.string().uuid()).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export interface TaskExecutor<T = any, R = any> {
  type: string;
  execute(payload: T, task: Task): Promise<R>;
  validate?(payload: T): Promise<boolean>;
  onProgress?(progress: number, task: Task): void;
}

export interface TaskEvent {
  taskId: string;
  event: 'created' | 'queued' | 'started' | 'progress' | 'completed' | 'failed' | 'cancelled' | 'retried';
  timestamp: Date;
  data?: any;
}

export interface TaskMetrics {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgExecutionTime: number;
  throughput: number;
  errorRate: number;
}
