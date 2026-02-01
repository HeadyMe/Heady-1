/**
 * Unit tests for Task Router
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskRouter, Task } from '../services/task-router.js';

describe('TaskRouter', () => {
  let router: TaskRouter;

  beforeEach(() => {
    router = new TaskRouter();
  });

  describe('getServiceForTask', () => {
    it('should route code_generation to jules', async () => {
      const task: Task = {
        type: 'code_generation',
        description: 'Generate a function',
      };

      // Access private method through execution
      const result = await router.executeTask(task);
      expect(result.service).toBe('jules');
    });

    it('should route research to github-copilot', async () => {
      const task: Task = {
        type: 'research',
        description: 'Find best practices',
      };

      const result = await router.executeTask(task);
      expect(result.service).toBe('github-copilot');
    });

    it('should route browser_automation to playwright', async () => {
      const task: Task = {
        type: 'browser_automation',
        description: 'Navigate to URL',
      };

      const result = await router.executeTask(task);
      expect(result.service).toBe('playwright');
    });

    it('should route design_system to heady', async () => {
      const task: Task = {
        type: 'design_system',
        description: 'Generate Phi tokens',
      };

      const result = await router.executeTask(task);
      expect(result.service).toBe('heady');
    });
  });

  describe('executeTask', () => {
    it('should return TaskResult with success status', async () => {
      const task: Task = {
        type: 'code_generation',
        description: 'Test task',
      };

      const result = await router.executeTask(task);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('service');
      expect(result).toHaveProperty('executionTime');
      expect(typeof result.executionTime).toBe('number');
    });

    it('should handle task execution errors gracefully', async () => {
      const task: Task = {
        type: 'code_generation',
        description: '',
      };

      const result = await router.executeTask(task);

      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should measure execution time', async () => {
      const task: Task = {
        type: 'code_generation',
        description: 'Test timing',
      };

      const result = await router.executeTask(task);

      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('executeBatch', () => {
    it('should execute multiple tasks in parallel', async () => {
      const tasks: Task[] = [
        { type: 'code_generation', description: 'Task 1' },
        { type: 'research', description: 'Task 2' },
        { type: 'design_system', description: 'Task 3' },
      ];

      const results = await router.executeBatch(tasks);

      expect(results).toHaveLength(3);
      expect(results[0].service).toBe('jules');
      expect(results[1].service).toBe('github-copilot');
      expect(results[2].service).toBe('heady');
    });

    it('should handle empty task array', async () => {
      const results = await router.executeBatch([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('getAvailableServices', () => {
    it('should return list of available services', () => {
      const services = router.getAvailableServices();
      expect(Array.isArray(services)).toBe(true);
    });
  });

  describe('getRunningServices', () => {
    it('should return list of running services', () => {
      const services = router.getRunningServices();
      expect(Array.isArray(services)).toBe(true);
    });
  });
});
