import { randomUUID } from 'crypto';
import type { AgentStartResponse } from './types';

/**
 * Task storage interface
 */
interface TaskInfo {
  taskId: string;
  query: string;
  params?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'error';
  createdAt: Date;
}

/**
 * In-memory task storage
 * TODO: Replace with database or cache (Redis) in production
 */
const taskStore = new Map<string, TaskInfo>();

/**
 * Start an agent task and return a task ID for SSE streaming
 */
export async function agentStart(
  query: string,
  params?: Record<string, unknown>
): Promise<AgentStartResponse['data']> {
  // Generate a random UUID for the task
  const taskId = randomUUID();
  
  // Construct SSE URL for this task
  const sseUrl = `/api/agent/stream/${taskId}`;
  
  // Store task information
  taskStore.set(taskId, {
    taskId,
    query,
    params,
    status: 'pending',
    createdAt: new Date(),
  });
  
  return {
    taskId,
    query,
    sseUrl,
  };
}

/**
 * Get task information by task ID
 */
export function getTask(taskId: string): TaskInfo | undefined {
  const task = taskStore.get(taskId);
  return task;
}

/**
 * Update task status
 */
export function updateTaskStatus(
  taskId: string,
  status: TaskInfo['status']
): void {
  const task = taskStore.get(taskId);
  if (task) {
    task.status = status;
    taskStore.set(taskId, task);
  }
}

/**
 * Clean up completed tasks (optional, for memory management)
 */
export function cleanupTask(taskId: string): void {
  console.log(`[cleanupTask] Removing taskId: ${taskId} at ${new Date().toISOString()}`);
  taskStore.delete(taskId);
}

/**
 * Get task store size (for debugging)
 */
export function getTaskStoreSize(): number {
  return taskStore.size;
}

/**
 * Get all task IDs (for debugging)
 */
export function getAllTaskIds(): string[] {
  return Array.from(taskStore.keys());
}

/**
 * Validate agent query
 */
export function validateQuery(query: string): { valid: boolean; error?: string } {
  if (!query || query.trim().length === 0) {
    return { valid: false, error: 'Query cannot be empty' };
  }
  
  if (query.length > 1000) {
    return { valid: false, error: 'Query is too long (max 1000 characters)' };
  }
  
  return { valid: true };
}

