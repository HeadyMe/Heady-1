/**
 * Unit tests for MCP Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPClient, MCPService } from '../services/mcp-client.js';

describe('MCPClient', () => {
  let client: MCPClient;
  const mockService: MCPService = {
    name: 'test-service',
    command: 'node',
    args: ['-e', 'console.log("test")'],
    description: 'Test service',
  };

  beforeEach(() => {
    client = new MCPClient(mockService);
  });

  afterEach(async () => {
    if (client.isRunning()) {
      await client.stop();
    }
  });

  describe('start', () => {
    it('should start the MCP service process', async () => {
      await client.start();
      expect(client.isRunning()).toBe(true);
    });

    it('should handle service startup errors', async () => {
      const badService: MCPService = {
        name: 'bad-service',
        command: 'nonexistent-command',
        args: [],
        description: 'Bad service',
      };
      const badClient = new MCPClient(badService);

      await expect(badClient.start()).rejects.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop a running service', async () => {
      await client.start();
      expect(client.isRunning()).toBe(true);

      await client.stop();
      expect(client.isRunning()).toBe(false);
    });

    it('should handle stopping an already stopped service', async () => {
      await expect(client.stop()).resolves.not.toThrow();
    });
  });

  describe('request', () => {
    it('should throw error if service not started', async () => {
      await expect(client.request('test-method')).rejects.toThrow('MCP service not started');
    });

    it('should timeout after 30 seconds', async () => {
      await client.start();
      
      // Mock a service that doesn't respond
      const slowRequest = client.request('slow-method');
      
      // Fast-forward time
      vi.useFakeTimers();
      vi.advanceTimersByTime(31000);
      
      await expect(slowRequest).rejects.toThrow('Request timeout');
      
      vi.useRealTimers();
    }, 35000);
  });

  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(client.isRunning()).toBe(false);
    });

    it('should return true after starting', async () => {
      await client.start();
      expect(client.isRunning()).toBe(true);
    });

    it('should return false after stopping', async () => {
      await client.start();
      await client.stop();
      expect(client.isRunning()).toBe(false);
    });
  });
});
