import { LogEntry } from '../types';

export class Logger {
  private level: 'debug' | 'info' | 'warn' | 'error';
  private history: LogEntry[] = [];
  private maxHistory: number = 1000;

  private levelPriority = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.level = level;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: any): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: any): void {
    this.log('error', message, context);
  }

  /**
   * Internal log method
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: any): void {
    if (this.levelPriority[level] < this.levelPriority[this.level]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
    };

    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Console output
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`, context || '');
  }

  /**
   * Set log level
   */
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.level = level;
  }

  /**
   * Get log history
   */
  getHistory(): LogEntry[] {
    return [...this.history];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.history = [];
  }
}
