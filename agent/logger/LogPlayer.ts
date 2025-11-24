/**
 * Agent Log Player
 * Independent module, supports replay by original time differences or fixed intervals
 */

import * as fs from 'fs';
import type { LogEntry, LogPlayerOptions, LogPlaybackCallback } from './types';

export class LogPlayer {
  private logFilePath: string;
  private mode: 'realtime' | 'fixed';
  private fixedInterval: number;
  private speed: number;

  constructor(options: LogPlayerOptions) {
    this.logFilePath = options.logFilePath;
    this.mode = options.mode || 'realtime';
    this.fixedInterval = options.fixedInterval || 1000;
    this.speed = options.speed || 1.0;

    // Verify file exists
    if (!fs.existsSync(this.logFilePath)) {
      throw new Error(`Log file does not exist: ${this.logFilePath}`);
    }
  }

  /**
   * Parse log file
   */
  public parseLogFile(): LogEntry[] {
    const content = fs.readFileSync(this.logFilePath, 'utf-8');
    const entries: LogEntry[] = [];

    // Split message blocks by blank lines
    const blocks = content.split('\n\n').filter(block => block.trim());

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 2) {
        continue; // Skip invalid blocks
      }

      // Parse metadata from first line
      const headerParts = lines[0].split('-');
      if (headerParts.length !== 3) {
        console.warn('Invalid log entry header:', lines[0]);
        continue;
      }

      const count = parseInt(headerParts[0], 10);
      const timestamp = parseInt(headerParts[1], 10);
      const timeDiff = parseInt(headerParts[2], 10);

      // Parse JSON message (from second line to end)
      const messageJson = lines.slice(1).join('\n');
      let message: unknown;
      try {
        message = JSON.parse(messageJson);
      }
      catch (err) {
        console.warn('Unable to parse JSON message:', messageJson, err);
        continue;
      }

      entries.push({
        count,
        timestamp,
        timeDiff,
        message,
      });
    }

    return entries;
  }

  /**
   * Replay log
   * @param callback Callback function for each message
   */
  public async replay(callback: LogPlaybackCallback): Promise<void> {
    const entries = this.parseLogFile();
    const total = entries.length;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Execute callback
      await callback(entry, i, total);

      // Wait before playing next one (except for the last one)
      if (i < entries.length - 1) {
        const delay = this.calculateDelay(entry, entries[i + 1]);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Calculate delay time
   */
  private calculateDelay(currentEntry: LogEntry, nextEntry: LogEntry): number {
    if (this.mode === 'fixed') {
      return this.fixedInterval / this.speed;
    }
    else {
      // realtime mode: use next message's timeDiff (time difference from current message)
      const originalDelay = nextEntry.timeDiff;
      return originalDelay / this.speed;
    }
  }

  /**
   * Sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get log summary information
   */
  public getLogSummary(): {
    filePath: string
    totalMessages: number
    firstTimestamp: number
    lastTimestamp: number
    duration: number
  } | null {
    const entries = this.parseLogFile();
    if (entries.length === 0) {
      return null;
    }

    const firstTimestamp = entries[0].timestamp;
    const lastTimestamp = entries[entries.length - 1].timestamp;
    const duration = lastTimestamp - firstTimestamp;

    return {
      filePath: this.logFilePath,
      totalMessages: entries.length,
      firstTimestamp,
      lastTimestamp,
      duration,
    };
  }

  /**
   * Static method: List all log files
   */
  public static listLogFiles(logDir: string): string[] {
    if (!fs.existsSync(logDir)) {
      return [];
    }

    const files = fs.readdirSync(logDir);
    return files
      .filter(file => file.startsWith('eko-log-') && file.endsWith('.log'))
      .map(file => `${logDir}/${file}`)
      .sort()
      .reverse(); // Newest first
  }
}
