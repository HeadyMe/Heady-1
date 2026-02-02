import { TaskSystem, TaskExecutor, Task } from '@heady/task-manager';
import { config } from '../config.js';
import { mcpManager } from './mcp-manager.js';
import { logger } from '../utils/logger.js';
import { getGistManager } from './gist-manager.js';
import { chromium } from 'playwright';

// Initialize the task system
// Use resilient configuration for Genesis Prime (Memory Mode Fallback)
const isMemoryMode = process.env.HC_MODE === 'memory' || true; // Force memory for now to guarantee start

export const taskSystem = new TaskSystem({
  mode: isMemoryMode ? 'memory' : 'auto',
  queue: {
    redis: isMemoryMode ? {} as any : config.redis,
    concurrency: config.task.concurrency,
    maxRetries: config.task.maxRetries,
    retryDelay: 1000,
  },
  database: {
    connectionString: isMemoryMode ? '' : config.database.url,
  },
  monitoring: {
    enabled: config.monitoring.enabled,
    interval: config.monitoring.interval,
  },
  server: {
    // Disable internal server port binding to avoid EADDRINUSE if we just want the logic
    // Using a random high port or 0 if supported, but let's just use a safe offset
    port: 4200, 
  }
});

export const taskManager = taskSystem.getTaskManager();

// Register Executors

// 1. MCP Executor (Generic)
const mcpExecutor: TaskExecutor = {
  type: 'mcp_task',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  async execute(payload: any, task: Task) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
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
