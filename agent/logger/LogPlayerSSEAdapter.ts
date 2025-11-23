/**
 * LogPlayer SSE Adapter
 * Adapts log replay functionality to SSE streams, for mocking data and debugging
 */

import { LogPlayer } from './LogPlayer';
import type { LogPlayerOptions } from './types';

/**
 * SSE Replay Adapter Options
 */
export interface SSEAdapterOptions extends LogPlayerOptions {
  /** 
   * SSE message callback, called for each log message
   * @param message - Original message content (from log)
   * @param metadata - Metadata (sequence number, timestamp, etc.)
   */
  onMessage: (message: unknown, metadata: {
    count: number;
    timestamp: number;
    timeDiff: number;
    index: number;
    total: number;
  }) => void | Promise<void>;

  /**
   * Completion callback (optional)
   */
  onComplete?: () => void | Promise<void>;

  /**
   * Error callback (optional)
   */
  onError?: (error: Error) => void | Promise<void>;

  /**
   * Start callback (optional)
   */
  onStart?: (summary: {
    totalMessages: number;
    duration: number;
    firstTimestamp: number;
    lastTimestamp: number;
  }) => void | Promise<void>;
}

/**
 * SSE Replay Adapter
 * Adapts LogPlayer to SSE streams
 */
export class LogPlayerSSEAdapter {
  private player: LogPlayer;
  private options: SSEAdapterOptions;

  constructor(options: SSEAdapterOptions) {
    this.options = options;
    this.player = new LogPlayer({
      logFilePath: options.logFilePath,
      mode: options.mode,
      fixedInterval: options.fixedInterval,
      speed: options.speed,
    });
  }

  /**
   * Start replay
   */
  async start(): Promise<void> {
    try {
      // Get log summary
      const summary = this.player.getLogSummary();
      
      if (!summary) {
        throw new Error('Unable to get log summary, log file may be empty');
      }

      // Call start callback
      if (this.options.onStart) {
        await this.options.onStart({
          totalMessages: summary.totalMessages,
          duration: summary.duration,
          firstTimestamp: summary.firstTimestamp,
          lastTimestamp: summary.lastTimestamp,
        });
      }

      // Start replay
      await this.player.replay(async (entry, index, total) => {
        await this.options.onMessage(entry.message, {
          count: entry.count,
          timestamp: entry.timestamp,
          timeDiff: entry.timeDiff,
          index,
          total,
        });
      });

      // Call completion callback
      if (this.options.onComplete) {
        await this.options.onComplete();
      }
    } catch (error) {
      // Call error callback
      if (this.options.onError) {
        await this.options.onError(
          error instanceof Error ? error : new Error(String(error))
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Get log summary
   */
  getSummary() {
    return this.player.getLogSummary();
  }

  /**
   * Static method: List all available log files
   */
  static listAvailableLogs(logDir: string): string[] {
    return LogPlayer.listLogFiles(logDir);
  }

  /**
   * Static method: Get the latest log file
   */
  static getLatestLog(logDir: string): string | null {
    const logs = LogPlayer.listLogFiles(logDir);
    return logs.length > 0 ? logs[0] : null;
  }
}

