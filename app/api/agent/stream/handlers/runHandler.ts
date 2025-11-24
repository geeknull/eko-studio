/**
 * SSE Agent Run Handler
 * Handles real agent execution logic
 */

import { run } from '@/agent/index';
import { updateTaskStatus } from '@/app/api/agent/service';
import type { StreamCallbackMessage } from '@eko-ai/eko';

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
 * Task information
 */
export interface TaskInfo {
  query: string;
  params?: Record<string, unknown>;
}

/**
 * Run handler options
 */
export interface RunHandlerOptions {
  taskId: string;
  task: TaskInfo;
}

/**
 * Run handler
 * Responsible for all real agent execution logic
 */
export async function handleRun(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  options: RunHandlerOptions
): Promise<void> {
  const { taskId, task } = options;

  console.log('[Run Handler] Starting agent execution for task:', taskId);

  // Create callback to send messages to SSE stream
  const callback = {
    onMessage: async (message: StreamCallbackMessage) => {
      try {
        // Send agent message via SSE
        console.log("eko-message: ", JSON.stringify(message, null, 2));
        const time = new Date();
        controller.enqueue(
          encoder.encode(formatSSEMessage('message', {
            time: time.toISOString(),
            timestamp: time.getTime(),
            content: message
          }))
        );
      } catch (error) {
        // Check for invalid state error which indicates stream closure
        if (error instanceof TypeError && (
          error.message.includes('Invalid state') || 
          error.message.includes('Controller is already closed')
        )) {
          console.warn('[Run Handler] SSE connection closed by client');
        } else {
          console.error('[Run Handler] Error sending SSE message:', error);
        }
      }
    },
  };

  // Extract normalConfig from params if present
  const normalConfig = task.params?.normalConfig as Record<string, unknown> | undefined;
  
  // Run agent
  await run({
    query: task.query,
    callback,
    normalConfig, // Pass normalConfig if provided
    ...task.params, // Merge other external parameters
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

  console.log('[Run Handler] Finished successfully');
}

