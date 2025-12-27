/**
 * Agent API type definitions
 */

export interface AgentStartResponse {
  success: boolean
  data?: {
    taskId: string
    query: string
    sseUrl: string
  }
  error?: string
  timestamp: string
}
