import { StreamCallbackMessage } from './agent'

/**
 * Connection established event
 */
export interface ConnectedEvent {
  type: 'connected'
  message: string
}

/**
 * Heartbeat event
 */
export interface HeartbeatEvent {
  type: 'heartbeat'
  timestamp: number
}

/**
 * Completion event
 */
export interface CompleteEvent {
  type: 'complete'
  message: string
}

/**
 * Agent message event
 */
export interface AgentMessageEvent {
  time: string
  timestamp: number
  content: StreamCallbackMessage
}

/**
 * Simple text message event
 */
export interface TextMessageEvent {
  type: 'message'
  id?: string | number
  content: string
}

/**
 * SSE event data union type
 */
export type SseEventData = 
  | ConnectedEvent 
  | HeartbeatEvent 
  | CompleteEvent 
  | AgentMessageEvent 
  | TextMessageEvent

