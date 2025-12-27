/**
 * Type definitions for log recording and replay
 */

/**
 * Log message entry
 */
export interface LogEntry {
  /** Message sequence number (starting from 1) */
  count: number
  /** Timestamp (milliseconds) */
  timestamp: number
  /** Time difference from previous message (milliseconds) */
  timeDiff: number
  /** Original message content */
  message: unknown
}

/**
 * Logger options
 */
export interface LoggerOptions {
  /** Log directory, defaults to agent-log in project root */
  logDir?: string
  /** Model name */
  modelName: string
  /** Whether to enable logging, defaults to true */
  enabled?: boolean
}

/**
 * Log player options
 */
export interface LogPlayerOptions {
  /** Log file path */
  logFilePath: string
  /** Replay mode: 'realtime' uses original time differences, 'fixed' uses fixed intervals */
  mode?: 'realtime' | 'fixed'
  /** Fixed time interval (milliseconds), only effective when mode='fixed' */
  fixedInterval?: number
  /** Playback speed multiplier, defaults to 1.0 (normal speed), 2.0 means 2x speed */
  speed?: number
}

/**
 * Log playback callback function
 */
export type LogPlaybackCallback = (entry: LogEntry, index: number, total: number) => void | Promise<void>;
