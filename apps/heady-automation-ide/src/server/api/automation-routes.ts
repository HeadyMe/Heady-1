import { Router, type Router as RouterType } from 'express';
import { persistentTaskManager } from '../services/persistent-task-manager.js';
import { taskRouter, Task } from '../services/task-router.js';
import { getGistManager } from '../services/gist-manager.js';
import { mcpManager } from '../services/mcp-manager.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { rateLimits } from '../middleware/rate-limiter.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';
import { chromium } from 'playwright';

const router: RouterType = Router();

function requireAutomationApiKey(req: any, res: any): boolean {
  const requiredKey = process.env.HC_AUTOMATION_API_KEY;
  if (!requiredKey) return true;

  const providedKey = req.header('x-api-key');
  if (providedKey && providedKey === requiredKey) return true;

  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

// MCP Task Execution Endpoint
router.post('/task/execute', rateLimits.mcpTasks, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  
  const taskData: Task = req.body;
  
  if (!taskData.type || !taskData.description) {
    res.status(400).json({ error: 'Task type and description required' });
    return;
  }
  
  // Use taskRouter to prepare params
  const prepared = taskRouter.prepareTaskExecution(taskData);
  
  // Create task in TaskManager
  const task = await persistentTaskManager.getManager().createTask({
    type: 'mcp-task',
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

// Batch task execution
router.post('/task/batch', rateLimits.mcpTasks, asyncHandler(async (req, res) => {
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

// Screenshot task
router.post('/task/screenshot', rateLimits.mcpTasks, asyncHandler(async (req, res) => {
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

// GitHub Gists Integration - Create
router.post('/gist/create', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;
  
  const { description, files, isPublic } = req.body;
  
  // Use task manager for gist creation to ensure reliability/queuing?
  // Or keep it direct if it's fast? 
  // Let's use Task Manager to match the pattern of "Automation IDE"
  
  const task = await persistentTaskManager.getManager().createTask({
      type: 'snippet_management',
      name: `Create Gist: ${description}`,
      payload: {
          action: 'create',
          description,
          files,
          isPublic
      }
  });

  res.json({ success: true, taskId: task.id, message: "Gist creation queued" });
}));

// Gist - Get (Read-only, maybe keep direct for speed?)
router.get('/gist/:id', rateLimits.standard, asyncHandler(async (req, res) => {
  const gistManager = getGistManager();
  const gist = await gistManager.getGist(req.params.id);
  res.json(gist);
}));

router.get('/gist', rateLimits.standard, asyncHandler(async (req, res) => {
  const gistManager = getGistManager();
  const gists = await gistManager.listGists();
  res.json({ gists });
}));

export default router;
