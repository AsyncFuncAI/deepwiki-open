/**
 * Frontend logging utility with log levels
 * Supports: ERROR, WARN, INFO, DEBUG, VERBOSE
 * 
 * Set log level via environment variable or localStorage:
 * - Environment: NEXT_PUBLIC_LOG_LEVEL
 * - localStorage: 'logLevel'
 * 
 * Default: INFO
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

class Logger {
  private currentLevel: LogLevel;
  private readonly prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
    this.currentLevel = this.getLogLevelFromConfig();
  }

  private getLogLevelFromConfig(): LogLevel {
    // Try to get from environment variable first
    const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      return LogLevel[envLevel as keyof typeof LogLevel] as LogLevel;
    }

    // Try localStorage (only in browser)
    if (typeof window !== 'undefined') {
      const storedLevel = localStorage.getItem('logLevel')?.toUpperCase();
      if (storedLevel && storedLevel in LogLevel) {
        return LogLevel[storedLevel as keyof typeof LogLevel] as LogLevel;
      }
    }

    // Default to INFO
    return LogLevel.INFO;
  }

  /**
   * Set the current log level
   */
  setLevel(level: LogLevel | keyof typeof LogLevel): void {
    if (typeof level === 'string') {
      this.currentLevel = LogLevel[level];
    } else {
      this.currentLevel = level;
    }

    // Store in localStorage if available
    if (typeof window !== 'undefined') {
      localStorage.setItem('logLevel', LogLevel[this.currentLevel]);
    }
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(level: string, ...args: unknown[]): unknown[] {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    return [`[${timestamp}] [${level}]${prefix}`, ...args];
  }

  error(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(...this.formatMessage('ERROR', ...args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(...this.formatMessage('WARN', ...args));
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(...this.formatMessage('INFO', ...args));
    }
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(...this.formatMessage('DEBUG', ...args));
    }
  }

  verbose(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      console.log(...this.formatMessage('VERBOSE', ...args));
    }
  }

  /**
   * Alias for console.log - always logs regardless of level
   */
  log(...args: unknown[]): void {
    console.log(...args);
  }
}

/**
 * Create a logger instance with an optional prefix
 */
export function createLogger(prefix?: string): Logger {
  return new Logger(prefix);
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Set global log level
 */
export function setLogLevel(level: LogLevel | keyof typeof LogLevel): void {
  logger.setLevel(level);
}

/**
 * Get current log level
 */
export function getLogLevel(): LogLevel {
  return logger.getLevel();
}

