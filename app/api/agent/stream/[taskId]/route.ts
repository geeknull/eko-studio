import { NextRequest } from 'next/server';
import { getTask, updateTaskStatus, getTaskStoreSize, getAllTaskIds } from '@/app/api/agent/service';
import { run } from '@/agent/index';
import type { StreamCallbackMessage } from '@eko-ai/eko';

/**
 * SSE endpoint for agent streaming
 * GET /api/agent/stream/[taskId]
 * 
 * Establishes SSE connection and runs agent with stored task parameters
 */

/**
 * Format SSE message
 */
function formatSSEMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Handle GET requests for SSE streaming
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> | { taskId: string } }
) {
  // In Next.js 15+, params might be a Promise, so we need to await it
  const resolvedParams = await Promise.resolve(params);
  const { taskId } = resolvedParams;

  console.log('SSE Request - taskId:', taskId);
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
        message: 'The task may have expired or was not created properly'
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
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
      }
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
      }
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
      }
    );
  }

  // Update task status to running
  updateTaskStatus(taskId, 'running');

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(
        encoder.encode(formatSSEMessage('connected', { taskId, status: 'connected' }))
      );

      // Create callback to send messages via SSE
      const callback = {
        onMessage: async (message: StreamCallbackMessage) => {
          try {
            // Send agent message via SSE
            console.log("eko-message: ", JSON.stringify(message, null, 2));
            controller.enqueue(
              encoder.encode(formatSSEMessage('message', message))
            );
          } catch (error) {
            console.error('Error sending SSE message:', error);
          }
        },
      };

      try {
        // Run agent with task query, callback, and external parameters
        await run({
          query: task.query,
          callback,
          ...task.params, // Merge external parameters
        });

        // Send completion message
        controller.enqueue(
          encoder.encode(
            formatSSEMessage('completed', {
              taskId,
              status: 'completed',
              message: 'Agent execution completed',
            })
          )
        );

        // Update task status
        updateTaskStatus(taskId, 'completed');
      } catch (error) {
        console.error('Agent execution error:', error);

        // Send error message
        controller.enqueue(
          encoder.encode(
            formatSSEMessage('error', {
              taskId,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          )
        );

        // Update task status
        updateTaskStatus(taskId, 'error');
      } finally {
        // Close the stream
        controller.close();
      }
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

