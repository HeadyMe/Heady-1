/**
 * Rate limiting middleware for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  middleware(config: RateLimitConfig) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const identifier = this.getIdentifier(req);
      const now = Date.now();

      if (!this.store[identifier] || this.store[identifier].resetTime < now) {
        this.store[identifier] = {
          count: 1,
          resetTime: now + config.windowMs,
        };
        next();
        return;
      }

      this.store[identifier].count++;

      if (this.store[identifier].count > config.maxRequests) {
        const retryAfter = Math.ceil((this.store[identifier].resetTime - now) / 1000);
        
        logger.warn('Rate limit exceeded', {
          identifier,
          path: req.path,
          count: this.store[identifier].count,
          limit: config.maxRequests,
        });

        res.set('Retry-After', String(retryAfter));
        res.status(429).json({
          error: {
            message: config.message || 'Too many requests, please try again later',
            statusCode: 429,
            retryAfter,
          },
        });
        return;
      }

      next();
    };
  }

  private getIdentifier(req: Request): string {
    // Use API key if present, otherwise IP address
    const apiKey = req.header('x-api-key');
    if (apiKey) {
      return `key:${apiKey}`;
    }
    return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const rateLimits = {
  // Standard API endpoints: 100 requests per minute
  standard: rateLimiter.middleware({
    windowMs: 60000,
    maxRequests: 100,
  }),

  // MCP task execution: 20 requests per minute
  mcpTasks: rateLimiter.middleware({
    windowMs: 60000,
    maxRequests: 20,
    message: 'MCP task rate limit exceeded. Maximum 20 tasks per minute.',
  }),

  // Authentication endpoints: 5 requests per minute
  auth: rateLimiter.middleware({
    windowMs: 60000,
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.',
  }),

  // Health check: 60 requests per minute
  health: rateLimiter.middleware({
    windowMs: 60000,
    maxRequests: 60,
  }),
};
