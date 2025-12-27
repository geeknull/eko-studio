import { NextRequest } from 'next/server';
import { getTask, updateTaskStatus, getTaskStoreSize, getAllTaskIds } from '@/app/api/agent/service';
import { getFixedIntervalConfig, getSpeedConfig, getDefaultReplayConfig } from '@/config/replayConfig';
import { handleRun } from '../handlers/runHandler';
import { handleReplay } from '../handlers/replayHandler';

export const runtime = 'nodejs';

/**
 * SSE endpoint for agent streaming
 * GET /api/agent/stream/[taskId]
 *
 * Establishes SSE connection and runs agent with stored task parameters
 */

/**
 * SSE Event Types matching frontend expectation
 */
type SSEEventType = 'connected' | 'message' | 'completed' | 'error';

/**
 * Format SSE message
 * Note: We always send event as 'message' to ensure frontend EventSource.onmessage handles it,
 * but we inject the actual event type into the data payload.
 */
function formatSSEMessage(eventType: SSEEventType, data: unknown): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Handle GET requests for SSE streaming
 * Supports two modes:
 * - mode=normal (default): Actually run the Agent
 * - mode=replay: Replay recorded logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> | { taskId: string } },
) {
  // In Next.js 15+, params might be a Promise, so we need to await it
  const resolvedParams = await Promise.resolve(params);
  const { taskId } = resolvedParams;

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'normal'; // 'normal' or 'replay'
  const logFile = searchParams.get('logFile'); // Specified log file (replay mode)
  const playbackMode = searchParams.get('playbackMode') || 'fixed'; // Playback mode realtime or fixed
  const defaultConfig = getDefaultReplayConfig(playbackMode as 'fixed' | 'realtime');
  const speed = parseFloat(searchParams.get('speed') || String(defaultConfig.speed)); // Playback speed
  const fixedInterval = parseInt(searchParams.get('fixedInterval') || String(defaultConfig.fixedInterval), 10); // Fixed interval

  console.log('SSE Request - taskId:', taskId);
  console.log('SSE Request - mode:', mode);
  console.log('SSE Request - resolvedParams:', resolvedParams);

  // Get task information
  const task = getTask(taskId);
  console.log('SSE Request - task found:', !!task);
  console.log('SSE Request - taskStore size:', getTaskStoreSize());

  if (!task) {
    console.error('Task not found:', {
      taskId,
      taskStoreKeys: getAllTaskIds(),
      taskStoreSize: getTaskStoreSize(),
    });
    return new Response(
      formatSSEMessage('error', {
        error: 'Task not found',
        taskId,
        message: 'The task may have expired or was not created properly',
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      },
    );
  }

  // Check if task is already completed or running
  if (task.status === 'completed') {
    console.log('Task already completed, sending final status');
    return new Response(
      formatSSEMessage('completed', {
        taskId,
        status: 'completed',
        message: 'Task was already completed',
        query: task.query,
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      },
    );
  }

  if (task.status === 'running') {
    console.log('Task is already running, rejecting duplicate connection');
    return new Response(
      formatSSEMessage('error', {
        taskId,
        status: 'error',
        error: 'Task is already running',
        message: 'Only one SSE connection per task is allowed',
      }),
      {
        status: 409, // Conflict
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      },
    );
  }

  if (task.status === 'error') {
    console.log('Task previously failed, rejecting reconnection');
    return new Response(
      formatSSEMessage('error', {
        taskId,
        status: 'error',
        error: 'Task previously failed',
        message: 'This task has already failed and cannot be retried',
      }),
      {
        status: 410, // Gone
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      },
    );
  }

  // Validate parameters
  if (mode === 'replay') {
    const speedConfig = getSpeedConfig();
    const fixedIntervalConfig = getFixedIntervalConfig();

    // Validate speed parameter
    if (speed < speedConfig.min || speed > speedConfig.max) {
      return new Response(
        formatSSEMessage('error', {
          error: 'Invalid speed parameter',
          message: `Speed must be between ${speedConfig.min} and ${speedConfig.max}`,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        },
      );
    }

    // Validate fixedInterval parameter
    if (fixedInterval < fixedIntervalConfig.min || fixedInterval > fixedIntervalConfig.max) {
      return new Response(
        formatSSEMessage('error', {
          error: 'Invalid fixedInterval parameter',
          message: `Fixed interval must be between ${fixedIntervalConfig.min} and ${fixedIntervalConfig.max} ms`,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        },
      );
    }
  }

  // Update task status to running
  updateTaskStatus(taskId, 'running');

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(
        encoder.encode(formatSSEMessage('connected', {
          taskId,
          status: 'connected',
          mode,
        })),
      );

      try {
        // Call different handlers based on mode
        if (mode === 'replay') {
          // ========================================
          // Replay mode: Call replay handler
          // ========================================
          await handleReplay(controller, encoder, {
            taskId,
            logFile,
            playbackMode,
            speed,
            fixedInterval,
          });
        }
        else {
          // ========================================
          // Run mode: Call run handler
          // ========================================
          console.log('isNodeRuntime', process?.release?.name === 'node');
          await handleRun(controller, encoder, {
            taskId,
            task: {
              query: task.query,
              params: task.params,
            },
          });
        }
      }
      catch (error) {
        console.error(`[SSE] ${mode} error:`, error);

        // Send error message
        controller.enqueue(
          encoder.encode(
            formatSSEMessage('error', {
              taskId,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              mode,
            }),
          ),
        );

        // Update task status
        updateTaskStatus(taskId, 'error');
      }
      finally {
        // Close the stream
        console.log(`[SSE] Stream closed for taskId: ${taskId}, mode: ${mode}`);
        controller.close();
      }
    },
    cancel(reason) {
      console.log(`[SSE] Stream cancelled for taskId: ${taskId}`, reason ? `Reason: ${reason}` : '');
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx
    },
  });
}
