import { TaskSystem, TaskExecutor, Task } from '@heady/task-manager';
import { config } from '../config.js';
import { mcpManager } from './mcp-manager.js';
import { logger } from '../utils/logger.js';
import { getGistManager } from './gist-manager.js';
import { chromium } from 'playwright';

// Initialize the task system
export const taskSystem = new TaskSystem({
  queue: {
    redis: config.redis,
    concurrency: config.task.concurrency,
    maxRetries: config.task.maxRetries,
    retryDelay: 1000,
  },
  database: {
    connectionString: config.database.url,
  },
  monitoring: {
    enabled: config.monitoring.enabled,
    interval: config.monitoring.interval,
  },
  server: {
    port: config.server.port + 1, // Run internal task server on a different port? Or just use the manager.
    // Actually TaskSystem creates its own express app. We might want to just use the manager directly
    // or mount the TaskSystem's router into our main app. 
    // For now, let's keep it simple and just use the manager instance if we can, 
    // but TaskSystem is the high level entry point.
    // The architecture doc says: "Initialize TaskManager in src/server/index.ts"
  }
});

export const taskManager = taskSystem.getTaskManager();

// Register Executors

// 1. MCP Executor (Generic)
const mcpExecutor: TaskExecutor = {
  type: 'mcp_task',
  async execute(payload: any, task: Task) {
    const { service, method, params } = payload;
    logger.info(`Executing MCP task: ${service}.${method}`);
    return await mcpManager.executeTask(service, method, params);
  }
};
taskManager.registerExecutor(mcpExecutor);

// 2. Playwright/Browser Executor
const browserExecutor: TaskExecutor = {
  type: 'browser_automation',
  async execute(payload: any, task: Task) {
    const { url, action, selector, value, interactive } = payload;
    
    // Simple screenshot implementation for now, or arbitrary script
    // This replicates the existing screenshot functionality but via task queue
    if (action === 'screenshot') {
      const browser = await chromium.launch({ 
        headless: !interactive,
        slowMo: interactive ? 500 : 0
      });
      const page = await browser.newPage();
      await page.goto(url);
      const buffer = await page.screenshot();
      const screenshot = buffer.toString('base64');
      await browser.close();
      return { screenshot: `data:image/png;base64,${screenshot}` };
    }
    
    // We can expand this to run full scripts
    throw new Error(`Unknown browser action: ${action}`);
  }
};
taskManager.registerExecutor(browserExecutor);

// 3. Gist Executor
const gistExecutor: TaskExecutor = {
  type: 'snippet_management',
  async execute(payload: any, task: Task) {
    const { action, ...args } = payload;
    const gistManager = getGistManager();
    
    if (action === 'create') {
        return await gistManager.createGist(args.description, args.files, args.isPublic);
    } else if (action === 'get') {
        return await gistManager.getGist(args.id);
    }
    
    throw new Error(`Unknown gist action: ${action}`);
  }
};
taskManager.registerExecutor(gistExecutor);

// 4. Code Generation (Jules/LLM) via MCP
const codeGenExecutor: TaskExecutor = {
    type: 'code_generation',
    async execute(payload: any, task: Task) {
        // Route to Jules or similar MCP
        return await mcpManager.executeTask('jules', 'generate_code', payload);
    }
};
taskManager.registerExecutor(codeGenExecutor);

// Initialize function
export async function initializeTaskSystem() {
  await taskSystem.start();
  logger.info('Task System initialized and started');
}

export async function stopTaskSystem() {
  await taskSystem.stop();
  logger.info('Task System stopped');
}
