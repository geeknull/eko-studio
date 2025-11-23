/**
 * Agent Logger
 * Independent module, not coupled with business logic
 */

import * as fs from 'fs';
import * as path from 'path';
import type { LogEntry, LoggerOptions } from './types';

export class AgentLogger {
  private logDir: string;
  private logFilePath: string | null = null;
  private messageCount = 0;
  private lastTimestamp = 0;
  private modelName: string;
  private enabled: boolean;
  private writeStream: fs.WriteStream | null = null;

  constructor(options: LoggerOptions) {
    this.logDir = options.logDir || path.join(process.cwd(), 'agent-log');
    this.modelName = options.modelName;
    this.enabled = options.enabled !== false;

    if (this.enabled) {
      this.initializeLogFile();
    }
  }

  /**
   * Initialize log file
   */
  private initializeLogFile(): void {
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Generate log file name
    const now = new Date();
    const timestamp = now.getTime();
    const dateStr = this.formatDateTime(now);
    const fileName = `eko-log-${timestamp}-${dateStr}-${this.sanitizeModelName(this.modelName)}.log`;
    this.logFilePath = path.join(this.logDir, fileName);

    // Create write stream
    this.writeStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
  }

  /**
   * Format date and time
   */
  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;
  }

  /**
   * Sanitize model name, remove unsafe filename characters
   */
  private sanitizeModelName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_.]/g, '_');
  }

  /**
   * Log a message
   */
  public async log(message: unknown): Promise<void> {
    if (!this.enabled || !this.writeStream) {
      return;
    }

    const timestamp = Date.now();
    const timeDiff = this.messageCount === 0 ? 0 : timestamp - this.lastTimestamp;
    this.messageCount++;

    const entry: LogEntry = {
      count: this.messageCount,
      timestamp,
      timeDiff,
      message,
    };

    // Write log
    const logLine = this.formatLogEntry(entry);
    await this.writeToFile(logLine);

    this.lastTimestamp = timestamp;
  }

  /**
   * Format log entry
   */
  private formatLogEntry(entry: LogEntry): string {
    const header = `${entry.count}-${entry.timestamp}-${entry.timeDiff}\n`;
    const messageJson = JSON.stringify(entry.message, null, 2);
    return `${header}${messageJson}\n\n`;
  }

  /**
   * Write to file
   */
  private writeToFile(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.writeStream) {
        return resolve();
      }

      this.writeStream.write(content, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Close the logger
   */
  public async close(): Promise<void> {
    if (this.writeStream) {
      return new Promise((resolve, reject) => {
        this.writeStream!.end((err?: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }

  /**
   * Get log file path
   */
  public getLogFilePath(): string | null {
    return this.logFilePath;
  }

  /**
   * Get count of logged messages
   */
  public getMessageCount(): number {
    return this.messageCount;
  }

  /**
   * Check if logger is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
}

