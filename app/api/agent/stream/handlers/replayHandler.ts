/**
 * SSE Log Replay Handler
 * Handles log replay logic, decoupled from agent execution logic
 */

import { LogPlayerSSEAdapter } from '@/agent/logger';
import * as path from 'path';

/**
 * SSE Event Type
 */
type SSEEventType = 'connected' | 'message' | 'completed' | 'error';

/**
 * Format SSE message
 */
function formatSSEMessage(eventType: SSEEventType, data: unknown): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Replay handler options
 */
export interface ReplayHandlerOptions {
  taskId: string
  logFile?: string | null
  playbackMode?: string
  speed?: number
  fixedInterval?: number
}

/**
 * Replay handler
 * Responsible for all SSE log replay logic
 */
export async function handleReplay(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  options: ReplayHandlerOptions,
): Promise<void> {
  const {
    taskId,
    logFile,
    playbackMode = 'realtime',
    speed = 1.0,
    fixedInterval = 1000,
  } = options;

  console.log('[Replay Handler] Starting replay with options:', {
    taskId,
    logFile,
    playbackMode,
    speed,
    fixedInterval,
  });

  // Determine log file path
  const logDir = path.join(process.cwd(), 'agent-log');
  let logFilePath: string | null = null;

  if (logFile) {
    // Use specified log file
    logFilePath = path.join(logDir, logFile);
    console.log('[Replay Handler] Using specified log file:', logFilePath);
  }
  else {
    // Use latest log file
    logFilePath = LogPlayerSSEAdapter.getLatestLog(logDir);
    console.log('[Replay Handler] Using latest log file:', logFilePath);
  }

  if (!logFilePath) {
    throw new Error('No available log file found');
  }

  // Create SSE adapter
  const adapter = new LogPlayerSSEAdapter({
    logFilePath,
    mode: playbackMode as 'realtime' | 'fixed',
    speed,
    fixedInterval,

    onStart: async (summary) => {
      console.log(`[Replay Handler] Started: ${summary.totalMessages} messages, ${summary.duration}ms`);

      // Send replay information
      controller.enqueue(
        encoder.encode(formatSSEMessage('message', {
          time: new Date().toISOString(),
          timestamp: Date.now(),
          content: {
            type: 'replay_info',
            data: {
              logFile: path.basename(logFilePath!),
              totalMessages: summary.totalMessages,
              duration: summary.duration,
              mode: playbackMode,
              speed,
              fixedInterval: playbackMode === 'fixed' ? fixedInterval : undefined,
            },
          },
        })),
      );
    },

    onMessage: async (message, metadata) => {
      try {
        // Send replayed message
        const time = new Date();
        controller.enqueue(
          encoder.encode(formatSSEMessage('message', {
            time: time.toISOString(),
            timestamp: time.getTime(),
            content: message,
            replay: {
              count: metadata.count,
              originalTimestamp: metadata.timestamp,
              timeDiff: metadata.timeDiff,
              progress: `${metadata.index + 1}/${metadata.total}`,
            },
          })),
        );
      }
      catch (error) {
        if (error instanceof TypeError && (
          error.message.includes('Invalid state')
          || error.message.includes('Controller is already closed')
        )) {
          console.warn('[Replay Handler] SSE connection closed by client');
        }
        else {
          console.error('[Replay Handler] Error sending message:', error);
        }
      }
    },

    onComplete: async () => {
      console.log('[Replay Handler] Completed');
    },

    onError: async (error) => {
      console.error('[Replay Handler] Error:', error);
      throw error;
    },
  });

  // Start replay
  await adapter.start();

  // Send completion message
  controller.enqueue(
    encoder.encode(
      formatSSEMessage('completed', {
        taskId,
        status: 'completed',
        message: 'Log replay completed',
        mode: 'replay',
      }),
    ),
  );

  console.log('[Replay Handler] Finished successfully');
}
