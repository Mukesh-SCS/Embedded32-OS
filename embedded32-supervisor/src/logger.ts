/**
 * Logger for the supervisor system
 */
export class Logger {
  private level: 'debug' | 'info' | 'warn' | 'error';
  private logFile?: string;

  constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info', logFile?: string) {
    this.level = level;
    this.logFile = logFile;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private write(level: string, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const timestamp = this.formatTimestamp();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const output = data ? `${prefix} ${message}` : `${prefix} ${message}`;

    if (level === 'error' && data) {
      console.error(output, data);
    } else if (level === 'warn') {
      console.warn(output);
    } else if (level === 'debug') {
      console.debug(output);
    } else {
      console.log(output);
    }

    // TODO: Write to log file if configured
    if (this.logFile && data) {
      // fs.appendFileSync(this.logFile, `${output}\n${JSON.stringify(data, null, 2)}\n`);
    }
  }

  debug(message: string, data?: unknown): void {
    this.write('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.write('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.write('warn', message, data);
  }

  error(message: string, error?: unknown): void {
    this.write('error', message, error);
  }

  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.level = level;
  }
}
