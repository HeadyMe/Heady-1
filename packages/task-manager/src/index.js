import express from 'express';
import { createServer } from 'http';
import { TaskManager } from './core/task-manager.js';
import { TaskWebSocketServer } from './core/websocket-server.js';
import { TaskRestAPI } from './api/rest-api.js';
import { logger } from './utils/logger.js';
export * from './types/task.types.js';
export * from './core/task-manager.js';
export * from './core/task-queue.js';
export * from './core/websocket-server.js';
export * from './persistence/task-repository.js';
export * from './api/rest-api.js';
export * from './monitoring/metrics-collector.js';
export class TaskSystem {
    config;
    app;
    httpServer;
    taskManager;
    wsServer;
    restApi;
    isRunning = false;
    constructor(config) {
        this.config = config;
        this.app = express();
        this.httpServer = createServer(this.app);
        // Initialize task manager
        this.taskManager = new TaskManager({
            queue: config.queue,
            database: config.database,
            monitoring: config.monitoring,
        });
        // Initialize WebSocket server
        this.wsServer = new TaskWebSocketServer(this.httpServer, {
            cors: config.websocket?.cors || {
                origin: '*',
                credentials: true,
            },
        });
        // Initialize REST API
        this.restApi = new TaskRestAPI(this.taskManager, // TaskManager has queue internally
        this.taskManager // TaskManager has repository internally
        );
        // Attach WebSocket server to task manager
        this.taskManager.attachWebSocketServer(this.wsServer);
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        // CORS
        this.app.use((req, res, next) => {
            const origin = req.headers.origin;
            if (origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            }
            else {
                next();
            }
        });
        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.info({
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration,
                });
            });
            next();
        });
    }
    setupRoutes() {
        // Mount REST API
        this.app.use('/api', this.restApi.getRouter());
        // Serve monitoring dashboard (if static files exist)
        this.app.use(express.static('public'));
        // Error handling
        this.app.use((err, req, res, next) => {
            logger.error('Unhandled error:', err);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: err.message,
            });
        });
    }
    async start() {
        if (this.isRunning) {
            logger.warn('Task system already running');
            return;
        }
        // Initialize task manager
        await this.taskManager.initialize();
        // Start task manager
        await this.taskManager.start();
        // Start HTTP server
        const { port, host = '0.0.0.0' } = this.config.server;
        await new Promise((resolve) => {
            this.httpServer.listen(port, host, () => {
                logger.info(`Task system server listening on ${host}:${port}`);
                resolve();
            });
        });
        this.isRunning = true;
        logger.info('Task system started successfully');
    }
    async stop() {
        if (!this.isRunning) {
            logger.warn('Task system not running');
            return;
        }
        // Stop task manager
        await this.taskManager.stop();
        // Close WebSocket server
        await this.wsServer.close();
        // Close HTTP server
        await new Promise((resolve) => {
            this.httpServer.close(() => {
                logger.info('HTTP server closed');
                resolve();
            });
        });
        this.isRunning = false;
        logger.info('Task system stopped');
    }
    getTaskManager() {
        return this.taskManager;
    }
    getApp() {
        return this.app;
    }
}
// Default export for quick setup
export default function createTaskSystem(config) {
    return new TaskSystem(config);
}
// Optimized System Components (v2.0)
export { NodeOrchestrator, NodeStatus, MessageType } from './core/node-orchestrator.js';
export { DeterministicWorkflowEngine, PREDEFINED_WORKFLOWS } from './core/deterministic-workflow.js';
export { OptimizedTaskRouter } from './core/optimized-task-router.js';
export { NodeCommunicationProtocol, PROTOCOL_CONSTANTS } from './core/communication-protocol.js';
export { SystemIntegrator, createSystemConfig } from './core/system-integrator.js';
export { PerformanceMonitor } from './monitoring/performance-monitor.js';
// Arena Mode
export { ArenaManager } from './core/arena-manager.js';
export { SquashMerger } from './core/squash-merger.js';
export * from './core/arena-protocol.js';
// Version
export const VERSION = '2.0.0';
export const OPTIMIZED_SYSTEM_VERSION = '2.0.0';
// System initialization helper
export async function initializeOptimizedSystem(config) {
    const { SystemIntegrator } = await import('./core/system-integrator.js');
    const integrator = new SystemIntegrator({
        databaseUrl: config.databaseUrl,
        deterministicSeed: config.deterministicSeed,
        enableMonitoring: true,
    });
    await integrator.initialize();
    await integrator.start();
    return integrator;
}
//# sourceMappingURL=index.js.map