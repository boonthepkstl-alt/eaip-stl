/* eslint-disable @typescript-eslint/no-explicit-any */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data);
    if (this.isDevelopment) {
      console.log(`[INFO] ${entry.timestamp}: ${message}`, data || '');
    }
  }

  warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data);
    console.warn(`[WARN] ${entry.timestamp}: ${message}`, data || '');
  }

  error(message: string, data?: any): void {
    const entry = this.createLogEntry('error', message, data);
    console.error(`[ERROR] ${entry.timestamp}: ${message}`, data || '');
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, data);
      console.debug(`[DEBUG] ${entry.timestamp}: ${message}`, data || '');
    }
  }
}

export const logger = new Logger();
