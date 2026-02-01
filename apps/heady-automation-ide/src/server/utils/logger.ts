/**
 * Structured logging utility for Heady Automation IDE
 * Provides consistent logging across all services with MCP integration
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  service?: string;
  mcpService?: string;
  taskId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.minLevel = this.getMinLevelFromEnv();
  }

  private getMinLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    return (level as LogLevel) || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const formatted = JSON.stringify(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatLog(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatLog(LogLevel.WARN, message, context, error));
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatLog(LogLevel.ERROR, message, context, error));
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log MCP service activity
   */
  mcpActivity(service: string, action: string, details?: any): void {
    this.info(`MCP ${action}`, {
      mcpService: service,
      action,
      ...details,
    });
  }

  /**
   * Log task execution
   */
  taskExecution(taskId: string, taskType: string, status: 'started' | 'completed' | 'failed', details?: any): void {
    const level = status === 'failed' ? LogLevel.ERROR : LogLevel.INFO;
    const message = `Task ${status}: ${taskType}`;
    
    if (level === LogLevel.ERROR) {
      this.error(message, { taskId, taskType, status, ...details });
    } else {
      this.info(message, { taskId, taskType, status, ...details });
    }
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info('API Request', {
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }
}

// Create default logger instance
export const logger = new Logger({ service: 'heady-automation-ide' });

// Export Logger class for creating custom instances
export { Logger };
