/**
 * Centralized logging service to replace console statements throughout the application.
 * Provides structured logging with different levels and context-aware formatting.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  robloxId?: string;
  [key: string]: unknown;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level for the application
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Format log message with context
   */
  private formatMessage(
    level: string,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context
      ? ` [${Object.entries(context)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")}]`
      : "";
    return `[${timestamp}] ${level}${contextStr}: ${message}`;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  /**
   * Debug level logging - only in development
   */
  public debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage("DEBUG", message, context));
    }
  }

  /**
   * Info level logging
   */
  public info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage("INFO", message, context));
    }
  }

  /**
   * Warning level logging
   */
  public warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message, context));
    }
  }

  /**
   * Error level logging
   */
  public error(
    message: string,
    error?: Error | unknown,
    context?: LogContext,
  ): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorStr =
        error instanceof Error ? error.stack || error.message : String(error);
      console.error(this.formatMessage("ERROR", message, context), errorStr);
    }
  }

  /**
   * Log API errors with structured context
   */
  public apiError(
    endpoint: string,
    status: number,
    message: string,
    context?: LogContext,
  ): void {
    this.error(`API Error: ${endpoint}`, undefined, {
      ...context,
      endpoint,
      status,
      action: "api_call",
    });
  }

  /**
   * Log user actions for debugging
   */
  public userAction(
    action: string,
    userId?: string,
    context?: LogContext,
  ): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
      userId,
    });
  }

  /**
   * Log performance metrics
   */
  public performance(
    operation: string,
    duration: number,
    context?: LogContext,
  ): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      operation,
      duration: `${duration}ms`,
    });
  }

  /**
   * Log data fetching operations
   */
  public dataFetch(
    operation: string,
    count: number,
    context?: LogContext,
  ): void {
    this.info(`Data Fetch: ${operation}`, {
      ...context,
      operation,
      count,
    });
  }

  /**
   * Log WebSocket events
   */
  public websocket(event: string, status: string, context?: LogContext): void {
    this.info(`WebSocket: ${event}`, {
      ...context,
      event,
      status,
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for common use cases
export const logError = (
  message: string,
  error?: Error | unknown,
  context?: LogContext,
) => logger.error(message, error, context);

export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);

export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);

export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);

export const logApiError = (
  endpoint: string,
  status: number,
  message: string,
  context?: LogContext,
) => logger.apiError(endpoint, status, message, context);

export const logUserAction = (
  action: string,
  userId?: string,
  context?: LogContext,
) => logger.userAction(action, userId, context);

export const logPerformance = (
  operation: string,
  duration: number,
  context?: LogContext,
) => logger.performance(operation, duration, context);

export const logDataFetch = (
  operation: string,
  count: number,
  context?: LogContext,
) => logger.dataFetch(operation, count, context);

export const logWebSocket = (event: string, status: string) =>
  logger.websocket(event, status);
