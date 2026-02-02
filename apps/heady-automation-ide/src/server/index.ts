import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { mcpManager } from './services/mcp-manager.js';
import { taskRouter, Task } from './services/task-router.js';
import { persistentTaskManager } from './services/persistent-task-manager.js';
import { getGistManager } from './services/gist-manager.js';
import { logger } from './utils/logger.js';
import { metrics } from './utils/metrics.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/error-handler.js';
import { rateLimits } from './middleware/rate-limiter.js';
import { monitoringService } from './services/monitoring-service.js';
import { RealtimeEventsHandler } from './websocket/realtime-events.js';
import { headyLens } from './services/heady-lens-service.js';
import { conductor } from './services/heady-conductor.js';
import { storyDriver } from './services/story-driver.js';
import monitoringRoutes from './api/monitoring-routes.js';
import arenaRoutes from './api/arena-routes.js';
import { TaskStatus } from '@heady/task-manager';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from project root if it exists
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });
dotenv.config(); // Also load .env if exists

const allowNonLocalOrigins = process.env.HC_ALLOW_NONLOCAL_ORIGINS === 'true';
const monitoringEnabled = process.env.HC_MONITORING_ENABLED !== 'false';
const monitoringIntervalMs = Number(process.env.HC_MONITORING_INTERVAL_MS || 5000);

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4100',
  'http://127.0.0.1:4100',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3003',
];

const configuredOrigins = (process.env.HC_AUTOMATION_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set<string>([...defaultOrigins, ...configuredOrigins]);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowNonLocalOrigins) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.has(origin));
  },
};

function requireAutomationApiKey(req: express.Request, res: express.Response): boolean {
  const requiredKey = process.env.HC_AUTOMATION_API_KEY;
  if (!requiredKey) return true;

  const providedKey = req.header('x-api-key');
  if (providedKey && providedKey === requiredKey) return true;

  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowNonLocalOrigins) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.has(origin));
    },
    methods: ['GET', 'POST'],
  },
});

app.disable('x-powered-by');
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.apiRequest(req.method, req.path, res.statusCode, duration);
    metrics.recordRequestTiming(req.path, duration);
  });
  next();
});

app.get('/api/health', rateLimits.health, (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'heady-automation-ide',
    mcp: {
      available: mcpManager.listServices(),
      running: mcpManager.getRunningServices()
    }
  });
});

// Metrics endpoint
app.get('/api/metrics', rateLimits.standard, (req, res) => {
  const summary = metrics.getSummary();
  res.json(summary);
});

app.get('/api/metrics/prometheus', (req, res) => {
  const prometheus = metrics.exportPrometheus();
  res.set('Content-Type', 'text/plain');
  res.send(prometheus);
});

// Queue status endpoint
app.get('/api/queue/status', rateLimits.standard, async (req, res) => {
  try {
    const status = await persistentTaskManager.getManager().getQueueStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// Monitoring endpoints
app.get('/api/monitoring/status', rateLimits.standard, (req, res) => {
  res.json(monitoringService.getMonitoringStatus());
});

app.get('/api/monitoring/metrics', rateLimits.standard, (req, res) => {
  const sinceRaw = req.query.since ? Number(req.query.since) : undefined;
  const limitRaw = req.query.limit ? Number(req.query.limit) : 100;
  const since = Number.isFinite(sinceRaw) ? sinceRaw : undefined;
  const limit = Number.isFinite(limitRaw) ? limitRaw : 100;

  res.json({
    latest: monitoringService.getLatestMetrics(),
    history: monitoringService.getMetricsHistory(since, limit),
  });
});

app.get('/api/monitoring/services', rateLimits.standard, (req, res) => {
  res.json({ services: monitoringService.getServiceStatuses() });
});

app.get('/api/monitoring/alerts', rateLimits.standard, (req, res) => {
  const limitRaw = req.query.limit ? Number(req.query.limit) : 100;
  const limit = Number.isFinite(limitRaw) ? limitRaw : 100;
  res.json({ alerts: monitoringService.getAllAlerts(limit) });
});

app.post('/api/monitoring/alerts/:id/resolve', rateLimits.standard, (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  const resolved = monitoringService.resolveAlert(req.params.id);
  res.json({ success: resolved });
});

app.post('/api/monitoring/start', rateLimits.standard, (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  const interval = Number(req.body?.intervalMs || monitoringIntervalMs);
  monitoringService.startMonitoring(Number.isFinite(interval) ? interval : monitoringIntervalMs);
  res.json({ success: true, intervalMs: monitoringIntervalMs });
});

app.post('/api/monitoring/stop', rateLimits.standard, (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  monitoringService.stopMonitoring();
  res.json({ success: true });
});

// Task queue concurrency control
app.post('/api/queue/concurrency', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  // Note: TaskManager's queue doesn't expose dynamic concurrency update in the current interface easily
  // We would need to restart the worker with new concurrency or add a method to TaskQueue.
  // For now, we'll return not implemented or skip.
  res.status(501).json({ error: 'Dynamic concurrency update not supported yet' });
}));

// MCP Service Management Endpoints
app.get('/api/mcp/services', rateLimits.standard, (req, res) => {
  res.json({
    available: mcpManager.listServices(),
    running: mcpManager.getRunningServices()
  });
});

app.get('/api/mcp/:service/tools', rateLimits.standard, asyncHandler(async (req, res) => {
  const { service } = req.params;
  try {
    const tools = await mcpManager.listTools(service);
    res.json({ tools });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

app.post('/api/mcp/:service/tools/:tool/call', rateLimits.mcpTasks, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  
  const { service, tool } = req.params;
  const args = req.body;
  
  try {
    const result = await mcpManager.callTool(service, tool, args);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

app.post('/api/mcp/start/:service', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  
  const { service } = req.params;
  await mcpManager.startService(service);
  logger.mcpActivity(service, 'started');
  res.json({ success: true, service, status: 'started' });
}));

app.post('/api/mcp/stop/:service', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  
  const { service } = req.params;
  await mcpManager.stopService(service);
  logger.mcpActivity(service, 'stopped');
  res.json({ success: true, service, status: 'stopped' });
}));

// MCP Task Execution Endpoint
app.post('/api/task/execute', rateLimits.mcpTasks, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  
  const taskData: Task = req.body;
  
  if (!taskData.type || !taskData.description) {
    res.status(400).json({ error: 'Task type and description required' });
    return;
  }
  
  // Use taskRouter to prepare params
  const prepared = taskRouter.prepareTaskExecution(taskData);
  
  // Create task in Persistent Manager
  const task = await persistentTaskManager.getManager().createTask({
    type: 'mcp_task',
    name: taskData.description.substring(0, 50) + (taskData.description.length > 50 ? '...' : ''),
    description: taskData.description,
    payload: prepared,
    priority: 3, // Normal
    metadata: {
        originalType: taskData.type,
        context: taskData.context
    }
  });

  logger.info('Task created and queued', { 
    taskId: task.id, 
    taskType: taskData.type, 
    description: taskData.description 
  });
  
  res.json(task);
}));

// Task Management API Endpoints
app.get('/api/tasks', rateLimits.standard, asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const tasks = await persistentTaskManager.getManager().getRecentTasks(limit);
  res.json({ tasks });
}));

app.get('/api/tasks/:id', rateLimits.standard, asyncHandler(async (req, res) => {
  const task = await persistentTaskManager.getManager().getTask(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(task);
}));

app.post('/api/tasks/:id/cancel', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  
  const success = await persistentTaskManager.getManager().cancelTask(req.params.id);
  if (!success) {
    res.status(400).json({ error: 'Could not cancel task' });
    return;
  }
  res.json({ success: true, taskId: req.params.id });
}));

app.delete('/api/tasks/:id', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  res.status(501).json({ error: 'Delete not implemented yet' });
}));

// Batch task execution
app.post('/api/task/batch', rateLimits.mcpTasks, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  
  const { tasks } = req.body;
  
  if (!Array.isArray(tasks)) {
    res.status(400).json({ error: 'tasks must be an array' });
    return;
  }
  
  // Create a batch task
  const batchTask = await persistentTaskManager.getManager().createTask({
    type: 'batch',
    name: 'Batch Execution',
    payload: tasks
  });
  
  res.json({ success: true, taskId: batchTask.id });
}));

app.post('/api/task/screenshot', rateLimits.mcpTasks, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;

  const { url, interactive } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL required' });
    return;
  }
  
  // Use task manager to execute screenshot
  const task = await persistentTaskManager.getManager().createTask({
    type: 'browser_automation',
    name: `Screenshot of ${url}`,
    payload: {
      action: 'screenshot',
      url,
      interactive
    }
  });
  
  res.json({ success: true, taskId: task.id, message: "Screenshot task queued" });
}));

// GitHub Gists Integration
app.post('/api/gist/create', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  
  const { description, files, isPublic } = req.body;
  const gistManager = getGistManager();
  const gist = await gistManager.createGist(description, files, isPublic);
  logger.info('Gist created', { gistId: gist.id });
  res.json({ success: true, gist });
}));

app.get('/api/gist/:id', rateLimits.standard, asyncHandler(async (req, res) => {
  const gistManager = getGistManager();
  const gist = await gistManager.getGist(req.params.id);
  res.json(gist);
}));

app.get('/api/gist', rateLimits.standard, asyncHandler(async (req, res) => {
  const gistManager = getGistManager();
  const gists = await gistManager.listGists();
  res.json({ gists });
}));

if (process.env.NODE_ENV === 'production') {
  const clientDir = path.join(__dirname, '../client');
  app.use(express.static(clientDir));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

// Mount API routes
app.use('/api', monitoringRoutes);
app.use('/api', arenaRoutes);

// Monitor lens status
app.get('/api/lens/snapshot', rateLimits.standard, asyncHandler(async (req, res) => {
  const snapshot = await headyLens.captureSnapshot();
  res.json(snapshot);
}));

// Conductor API
app.post('/api/conductor/tempo', rateLimits.standard, (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  const { bpm } = req.body;
  conductor.setTempo(Number(bpm));
  res.json({ success: true, bpm });
});

// Story Driver API
app.post('/api/story/arc', rateLimits.standard, (req, res) => {
  try {
    if (!requireAutomationApiKey(req, res)) return;
    const { goal } = req.body;
    console.log('[DEBUG] Story Arc Request:', { goal });
    
    if (!storyDriver) {
        console.error('[ERROR] storyDriver is undefined');
        res.status(500).json({ error: 'Story Driver service not initialized' });
        return;
    }

    const arc = storyDriver.initiateArc(goal || 'Untitled Goal');
    console.log('[DEBUG] Story Arc Created:', arc);
    res.json(arc);
  } catch (error: any) {
    console.error('[ERROR] Story Arc Route Failed:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/story/current', rateLimits.standard, (req, res) => {
  res.json(storyDriver.getCurrentContext());
});

// 404 handler
app.use(notFoundHandler);

// Setup WebSocket real-time events
const realtimeEvents = new RealtimeEventsHandler(io);

// Forward HeadyLens snapshots to all clients
headyLens.on('snapshot', (snapshot) => {
  io.emit('lens:snapshot', snapshot);
  // Feedback Loop: Feed visual cortex data back into the narrative engine
  storyDriver.observe(snapshot);
});

// Forward Conductor ticks
conductor.on('tick', (state) => {
  io.emit('conductor:tick', state);
});

// Forward Story updates
storyDriver.on('arc_started', (arc) => io.emit('story:update', { type: 'started', arc }));
storyDriver.on('chapter_advanced', (chapter) => io.emit('story:update', { type: 'chapter', chapter }));
storyDriver.on('arc_resolved', (arc) => io.emit('story:update', { type: 'resolved', arc }));

io.on('connection', (socket) => {
  realtimeEvents.handleConnection(socket);
  
  // Terminal events
  socket.on('terminal:input', (data) => {
    logger.debug('Terminal input', { clientId: socket.id, data });
  });
});

const PORT = process.env.PORT || 3000;

// Initialize MCP services
async function initializeMCP() {
  try {
    await mcpManager.loadConfig();
    console.log('✅ MCP Manager initialized');
  } catch (error) {
    console.error('⚠️  MCP initialization failed:', error);
  }
}

httpServer.listen(PORT, async () => {
  try {
    await persistentTaskManager.initialize(io);
  } catch (error) {
  headyLens.stopLens();
  conductor.stop();
    logger.error('Failed to initialize Persistent Task Manager', { error });
  }

  // Start monitoring
  monitoringService.startMonitoring(5000);

  logger.info('Heady Automation IDE Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: `/api/health`,
      mcpServices: `/api/mcp/services`,
      taskExecute: `/api/task/execute`,
      screenshot: `/api/task/screenshot`,
      metrics: `/api/metrics`,
      gists: `/api/gist`,
      monitoring: `/api/monitoring/status`,
      tasks: `/api/tasks`
    }
  });
  
  console.log(`🚀 Heady Automation IDE Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   MCP Services: http://localhost:${PORT}/api/mcp/services`);
  console.log(`   Metrics: http://localhost:${PORT}/api/metrics`);
  console.log(`   Queue Status: http://localhost:${PORT}/api/queue/status`);
  
  // Initialize MCP after server starts
  await initializeMCP();
  
  // Start monitoring
  monitoringService.startMonitoring(monitoringIntervalMs);
  headyLens.startLens();
  conductor.start();
  logger.info('Real-time monitoring started', { intervalMs: monitoringIntervalMs });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  monitoringService.stopMonitoring();
  await mcpManager.stopAll();
  await persistentTaskManager.stop();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  monitoringService.stopMonitoring();
  headyLens.stopLens();
  conductor.stop();
  await mcpManager.stopAll();
  await persistentTaskManager.stop();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});