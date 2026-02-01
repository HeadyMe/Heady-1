/**
 * Monitoring API Routes
 * RESTful endpoints for system monitoring and alerts
 */

import { Router, type Router as RouterType } from 'express';
import { monitoringService } from '../services/monitoring-service.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { rateLimits } from '../middleware/rate-limiter.js';

const router: RouterType = Router();

/**
 * Get latest system metrics
 */
router.get(
  '/monitoring/metrics/latest',
  rateLimits.health,
  asyncHandler(async (req, res) => {
    const metrics = monitoringService.getLatestMetrics();
    res.json(metrics || { message: 'No metrics available yet' });
  })
);

/**
 * Get metrics history
 */
router.get(
  '/monitoring/metrics/history',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    const since = req.query.since ? parseInt(req.query.since as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const history = monitoringService.getMetricsHistory(since, limit);
    res.json({ metrics: history, count: history.length });
  })
);

/**
 * Get service statuses
 */
router.get(
  '/monitoring/services',
  rateLimits.health,
  asyncHandler(async (req, res) => {
    const services = monitoringService.getServiceStatuses();
    res.json({ services, count: services.length });
  })
);

/**
 * Get service status by name
 */
router.get(
  '/monitoring/services/:name',
  rateLimits.health,
  asyncHandler(async (req, res) => {
    const status = monitoringService.getServiceStatus(req.params.name);

    if (!status) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json(status);
  })
);

/**
 * Get active alerts
 */
router.get(
  '/monitoring/alerts',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    const activeOnly = req.query.active === 'true';
    const alerts = activeOnly ? monitoringService.getActiveAlerts() : monitoringService.getAllAlerts();
    res.json({ alerts, count: alerts.length });
  })
);

/**
 * Resolve an alert
 */
router.post(
  '/monitoring/alerts/:id/resolve',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    const success = monitoringService.resolveAlert(req.params.id);

    if (!success) {
      res.status(404).json({ error: 'Alert not found or already resolved' });
      return;
    }

    res.json({ success: true });
  })
);

/**
 * Get monitoring status
 */
router.get(
  '/monitoring/status',
  rateLimits.health,
  asyncHandler(async (req, res) => {
    const status = monitoringService.getMonitoringStatus();
    res.json(status);
  })
);

/**
 * Start monitoring (if not already started)
 */
router.post(
  '/monitoring/start',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    const { intervalMs = 5000 } = req.body;
    monitoringService.startMonitoring(intervalMs);
    res.json({ success: true, intervalMs });
  })
);

/**
 * Stop monitoring
 */
router.post(
  '/monitoring/stop',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    monitoringService.stopMonitoring();
    res.json({ success: true });
  })
);

/**
 * Update service status
 */
router.post(
  '/monitoring/services/:name/status',
  rateLimits.standard,
  asyncHandler(async (req, res) => {
    const { status, message, metadata } = req.body;
    
    // Validate status
    if (status && !['healthy', 'degraded', 'unhealthy', 'offline'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    monitoringService.updateServiceStatus(req.params.name, {
      status,
      metadata: {
        ...metadata,
        message,
        lastUpdate: Date.now()
      }
    });

    res.json({ success: true });
  })
);

export default router;
