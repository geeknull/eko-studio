import { randomUUID } from 'crypto';
import type { AgentStartResponse } from './types';

/**
 * Start an agent task and return a task ID for SSE streaming
 */
export async function agentStart(query: string): Promise<AgentStartResponse['data']> {
  // Generate a random UUID for the task
  const taskId = randomUUID();
  
  // Construct SSE URL for this task
  const sseUrl = `/api/agent/stream/${taskId}`;
  
  // TODO: Store task information (query, status, etc.) in database or cache
  // For now, just return the task ID and SSE URL
  
  return {
    taskId,
    query,
    sseUrl,
  };
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

