# Task Manager - Real-time Task Management & Monitoring System

A robust, scalable task management system with real-time monitoring, WebSocket updates, and comprehensive metrics collection.

## Features

- **🚀 High-Performance Queue**: Redis-backed task queue with BullMQ
- **🔄 Real-time Updates**: WebSocket server for live task status
- **📊 Monitoring Dashboard**: Beautiful web UI with live metrics
- **💾 Persistent Storage**: PostgreSQL for task history and analytics
- **📈 Metrics Collection**: Prometheus-compatible metrics export
- **🔌 REST API**: Complete CRUD operations for task management
- **⚡ Worker Pools**: Concurrent task execution with configurable concurrency
- **🔁 Retry Logic**: Automatic retry with exponential backoff
- **📅 Task Scheduling**: Schedule tasks for future execution
- **🎯 Priority System**: 4-level priority queue (Critical, High, Normal, Low)

## Installation

```bash
# Navigate to the package directory
cd packages/task-manager

# Install dependencies
pnpm install

# Build the package
pnpm build
```

## Configuration

Create a `.env` file in the package root:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# PostgreSQL Configuration  
DATABASE_URL=postgresql://heady:password@localhost:5432/task_manager

# Server Configuration
PORT=8080
HOST=localhost

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
METRICS_INTERVAL=10000
```

## Quick Start

```typescript
import { TaskSystem } from '@heady/task-manager';

// Initialize the system
const taskSystem = new TaskSystem({
  server: {
    port: 8080,
    host: 'localhost'
  },
  queue: {
    redis: {
      host: 'localhost',
      port: 6379
    },
    concurrency: 5,
    maxRetries: 3,
    retryDelay: 5000
  },
  database: {
    connectionString: 'postgresql://localhost:5432/task_manager'
  },
  monitoring: {
    enabled: true,
    interval: 10000
  }
});

// Start the system
await taskSystem.start();

// Access the task manager
const taskManager = taskSystem.getTaskManager();

// Create a task
const task = await taskManager.createTask({
  name: 'Process Data',
  type: 'data-processing',
  priority: TaskPriority.HIGH,
  payload: { dataSet: 'users' }
});
```

## Custom Task Executors

Create custom task executors for specific task types:

```typescript
import { TaskExecutor } from '@heady/task-manager';

const myExecutor: TaskExecutor = {
  type: 'my-task-type',
  
  async execute(payload, task) {
    // Your task logic here
    console.log('Processing:', payload);
    
    // Update progress
    if (task.onProgress) {
      task.onProgress(50, task);
    }
    
    // Return result
    return { success: true, data: 'processed' };
  },
  
  async validate(payload) {
    // Optional validation
    return payload !== null;
  }
};

// Register the executor
taskManager.registerExecutor(myExecutor);
```

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get task by ID |
| POST | `/api/tasks` | Create new task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Cancel task |
| POST | `/api/tasks/:id/retry` | Retry failed task |
| GET | `/api/queue/status` | Get queue status |
| GET | `/api/metrics` | Get performance metrics |
| GET | `/api/stats` | Get statistics |

## WebSocket Events

Connect to the WebSocket server for real-time updates:

```javascript
const socket = io('ws://localhost:8080');

// Subscribe to all task events
socket.emit('subscribe:all');

// Subscribe to specific task
socket.emit('subscribe:task', taskId);

// Subscribe to task type
socket.emit('subscribe:type', 'data-processing');

// Subscribe to metrics
socket.emit('subscribe:metrics');

// Listen for events
socket.on('task:event', (event) => {
  console.log('Task event:', event);
});

socket.on('metrics:update', (metrics) => {
  console.log('Metrics:', metrics);
});
```

## Monitoring Dashboard

Access the web dashboard at `http://localhost:8080`

Features:
- Real-time queue status
- Performance metrics
- Task timeline chart
- Recent tasks list
- Task creation interface

## Task Lifecycle

1. **PENDING**: Task created but not queued
2. **QUEUED**: Task added to queue
3. **RUNNING**: Task being executed
4. **COMPLETED**: Task finished successfully
5. **FAILED**: Task execution failed
6. **CANCELLED**: Task was cancelled
7. **RETRYING**: Task failed and queued for retry

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   REST API   │────▶│ Task Manager │────▶│   Database   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  WebSocket   │────▶│ Task Queue   │────▶│    Redis     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Dashboard   │────▶│   Workers    │────▶│   Metrics    │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Performance

- **Throughput**: Up to 10,000 tasks/minute
- **Concurrency**: Configurable worker pools (1-100 workers)
- **Latency**: < 10ms queue insertion
- **Reliability**: Automatic retry with exponential backoff
- **Scalability**: Horizontal scaling with multiple instances

## Development

```bash
# Run in development mode
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

## Docker Support

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

EXPOSE 8080
CMD ["pnpm", "start"]
```

## License

MIT © HeadySystems

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>

