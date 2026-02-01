import { Router, type Router as RouterType } from 'express';
import { persistentTaskManager } from '../services/persistent-task-manager.js';
import { TaskStatus, TaskPriority } from '@heady/task-manager';
import { asyncHandler } from '../middleware/error-handler.js';
import { rateLimits } from '../middleware/rate-limiter.js';
import { logger } from '../utils/logger.js';

const router: RouterType = Router();

function requireAutomationApiKey(req: any, res: any): boolean {
  const requiredKey = process.env.HC_AUTOMATION_API_KEY;
  if (!requiredKey) return true;

  const providedKey = req.header('x-api-key');
  if (providedKey && providedKey === requiredKey) return true;

  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

/**
 * Create a new task
 */
router.post(
  '/tasks',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    if (!requireAutomationApiKey(req, res)) return;

    const { type, description, priority = TaskPriority.NORMAL, context, assignedTo, tags, payload } = req.body;

    if (!type || !description) {
      res.status(400).json({ error: 'type and description are required' });
      return;
    }

    const taskManager = persistentTaskManager.getManager();
    const task = await taskManager.createTask({
      type,
      name: description.substring(0, 50),
      description,
      priority,
      payload: payload || context || {},
      metadata: {
        assignedTo,
        tags,
        context
      }
    });

    res.status(201).json(task);
  })
);

/**
 * Get all tasks with optional filtering
 */
router.get(
  '/tasks',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    // Note: The underlying TaskRepository currently supports basic filtering.
    // For now we might need to rely on what's available or expand Repository.
    // The current repository methods are: findById, findByStatus, findByType.
    // Complex filtering like tags/assignedTo might need to be added to Repository later.
    
    const taskManager = persistentTaskManager.getManager();
    // Use exposed getRecentTasks method
    const tasks = await taskManager.getRecentTasks(req.query.limit ? Number(req.query.limit) : 50);
    
    res.json({ tasks, count: tasks.length });
  })
);

/**
 * Get task by ID
 */
router.get(
  '/tasks/:id',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    const taskManager = persistentTaskManager.getManager();
    const task = await taskManager.getTask(req.params.id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  })
);

/**
 * Update task status - NOT DIRECTLY SUPPORTED VIA API usually, better to let queue handle it.
 * But for manual intervention:
 */
router.patch(
  '/tasks/:id/status',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    if (!requireAutomationApiKey(req, res)) return;
    res.status(501).json({ error: 'Manual status update not supported in persistent mode yet' });
  })
);

/**
 * Update task progress - Usually done by workers
 */
router.patch(
  '/tasks/:id/progress',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    if (!requireAutomationApiKey(req, res)) return;
    // We could potentially allow this if we expose updateProgress on TaskManager
    res.status(501).json({ error: 'Manual progress update not supported in persistent mode yet' });
  })
);

/**
 * Cancel a task
 */
router.post(
  '/tasks/:id/cancel',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    if (!requireAutomationApiKey(req, res)) return;

    const taskManager = persistentTaskManager.getManager();
    const success = await taskManager.cancelTask(req.params.id);

    if (!success) {
      res.status(404).json({ error: 'Task not found or already completed' });
      return;
    }

    const task = await taskManager.getTask(req.params.id);
    res.json(task);
  })
);

/**
 * Delete a task - Not directly supported in TaskManager interface I saw (only cancel),
 * but Repository has no delete? Wait, repository has delete?
 * Repository has `cleanup` but not single delete.
 */
router.delete(
  '/tasks/:id',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    if (!requireAutomationApiKey(req, res)) return;
    
    // We'll treat delete as cancel for now, as persistent log is usually desired.
    const taskManager = persistentTaskManager.getManager();
    const success = await taskManager.cancelTask(req.params.id);

    if (!success) {
      res.status(404).json({ error: 'Task not found or could not be cancelled' });
      return;
    }

    res.status(204).send();
  })
);

/**
 * Get task statistics
 */
router.get(
  '/tasks/stats',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    const taskManager = persistentTaskManager.getManager();
    // Accessing repository stats
    const stats = await (taskManager as any).taskRepository.getStats();
    res.json(stats);
  })
);

/**
 * Get active tasks
 */
router.get(
  '/tasks/active',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    const taskManager = persistentTaskManager.getManager();
    // Workaround to get active tasks via repository findByStatus
    // We would need to combine PENDING, QUEUED, RUNNING
    // This is getting complicated without direct support.
    // Let's return recent tasks filtered for now or just the metrics which has counts.
    
    const stats = await taskManager.getQueueStatus();
    res.json(stats);
  })
);

/**
 * Clear old completed tasks
 */
router.post(
  '/tasks/cleanup',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    if (!requireAutomationApiKey(req, res)) return;

    const { olderThanMs = 86400000 } = req.body; // Default 24 hours
    const olderThan = new Date(Date.now() - olderThanMs);

    const taskManager = persistentTaskManager.getManager();
    const cleared = await taskManager.cleanup(olderThan);
    res.json({ success: true, cleared });
  })
);

export default router;
