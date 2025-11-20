/**
 * Job Logger - Captures logs during job execution
 * Stores logs in memory to be saved to database after job completes
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export class JobLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 500; // Limit logs to prevent memory issues

  /**
   * Log an info message
   */
  info(message: string, data?: any) {
    this.addLog("info", message, data);
    console.log(`[JOB] ${message}`, data || "");
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any) {
    this.addLog("warn", message, data);
    console.warn(`[JOB] ${message}`, data || "");
  }

  /**
   * Log an error message
   */
  error(message: string, data?: any) {
    this.addLog("error", message, data);
    console.error(`[JOB] ${message}`, data || "");
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any) {
    this.addLog("debug", message, data);
    console.debug(`[JOB] ${message}`, data || "");
  }

  /**
   * Add a log entry
   */
  private addLog(level: LogLevel, message: string, data?: any) {
    // Remove oldest log if we've hit the limit
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift();
    }

    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? this.sanitizeData(data) : undefined,
    });
  }

  /**
   * Sanitize data to prevent circular references and limit size
   */
  private sanitizeData(data: any): any {
    try {
      // Convert to JSON and back to remove circular references
      const jsonStr = JSON.stringify(data, null, 0);
      // Limit size to 1KB per log entry
      if (jsonStr.length > 1024) {
        return { _truncated: true, preview: jsonStr.substring(0, 1024) };
      }
      return JSON.parse(jsonStr);
    } catch (error) {
      return { _error: "Could not serialize data" };
    }
  }

  /**
   * Get all captured logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Get log count by level
   */
  getLogStats(): Record<LogLevel, number> {
    return {
      info: this.logs.filter((l) => l.level === "info").length,
      warn: this.logs.filter((l) => l.level === "warn").length,
      error: this.logs.filter((l) => l.level === "error").length,
      debug: this.logs.filter((l) => l.level === "debug").length,
    };
  }
}

