import { StreamCallbackMessage } from '../types';
import type { ChatMessage } from './chatStore';

/**
 * Normalized types: Planer -> workflow, Browser -> tool_use
 */
function normalizeType(type: string | undefined): string | undefined {
  if (!type) return type;

  // Normalize Planer and workflow to workflow
  if (type === 'Planer' || type === 'planer') {
    return 'workflow';
  }

  // Normalize Browser and tool_use to tool_use
  if (type === 'Browser' || type === 'browser') {
    return 'tool_use';
  }

  return type;
}

/**
 * Get agentName and normalized type of the message
 */
function getMessageKey(content: string | StreamCallbackMessage): { agentName?: string, type?: string } | null {
  if (typeof content !== 'object') return null;

  return {
    agentName: content.agentName,
    type: normalizeType(content.type),
  };
}

/**
 * Check if two messages should be merged based on agentName and type combination
 */
export function shouldMergeByAgentNameAndType(
  lastMessage: ChatMessage | undefined,
  newContent: string | StreamCallbackMessage,
): boolean {
  if (!lastMessage || lastMessage.role !== 'assistant') return false;

  // Check if both messages are object types
  if (typeof lastMessage.content !== 'object' || typeof newContent !== 'object') {
    return false;
  }

  const lastKey = getMessageKey(lastMessage.content);
  const newKey = getMessageKey(newContent);

  // If key cannot be obtained, do not merge
  if (!lastKey || !newKey) return false;

  // Check if both agentName and type are the same
  return lastKey.agentName === newKey.agentName && lastKey.type === newKey.type;
}

/**
 * Merge two messages with same agentName and type (Simplified version: overwrite directly)
 */
export function mergeMessagesByAgentNameAndType(
  lastMessage: ChatMessage,
  newContent: StreamCallbackMessage,
): ChatMessage {
  // Simplified version: overwrite directly
  return {
    ...lastMessage,
    content: newContent,
    repeat: (lastMessage.repeat || 1) + 1, // Increase repeat count
  };

  /*
  // Old version: Keep workflow.xml special handling logic (kept commented)
  // At this point, validated by shouldMergeByAgentNameAndType, lastMessage.content must be StreamCallbackMessage
  const lastContent = lastMessage.content as StreamCallbackMessage

  const mergedContent: StreamCallbackMessage = {
    ...lastContent,
    ...newContent,
    workflow: {
      ...lastContent.workflow!,
      ...newContent.workflow!,
      xml: newContent.workflow.xml !== undefined
        ? newContent.workflow.xml
        : lastContent.workflow.xml, // Latter xml overwrites former (if exists)
    }
  }

  return {
    ...lastMessage,
    content: mergedContent,
    repeat: (lastMessage.repeat || 1) + 1 // Increase repeat count
  }
  */
}

/**
 * Check if two messages should be merged based on workflow.taskId (Keep old logic for compatibility)
 */
export function shouldMergeByWorkflowTaskId(
  lastMessage: ChatMessage | undefined,
  newContent: string | StreamCallbackMessage,
): boolean {
  if (!lastMessage || lastMessage.role !== 'assistant') return false;

  // Check if new message has workflow.taskId
  if (typeof newContent !== 'object' || !newContent.workflow || !newContent.workflow.taskId) {
    return false;
  }

  // Check if last message has same workflow.taskId
  if (typeof lastMessage.content !== 'object'
    || !lastMessage.content.workflow
    || lastMessage.content.workflow.taskId !== newContent.workflow.taskId) {
    return false;
  }

  return true;
}

/**
 * Merge two messages with same workflow.taskId (Keep old logic for compatibility)
 */
export function mergeMessagesByWorkflowTaskId(
  lastMessage: ChatMessage,
  newContent: StreamCallbackMessage,
): ChatMessage {
  // At this point, validated by shouldMergeByWorkflowTaskId, lastMessage.content must be StreamCallbackMessage
  const lastContent = lastMessage.content as StreamCallbackMessage;

  const mergedContent: StreamCallbackMessage = {
    ...lastContent,
    ...newContent,
    workflow: {
      ...lastContent.workflow!,
      ...newContent.workflow!,
      xml: newContent.workflow.xml !== undefined
        ? newContent.workflow.xml
        : lastContent.workflow.xml, // Latter xml overwrites former (if exists)
    },
  };

  return {
    ...lastMessage,
    content: mergedContent,
    repeat: (lastMessage.repeat || 1) + 1, // Increase repeat count
  };
}

/**
 * Check if two messages are completely identical
 */
export function isSameMessage(
  msg1: ChatMessage | undefined,
  content2: string | StreamCallbackMessage,
): boolean {
  if (!msg1 || msg1.role !== 'assistant') return false;

  // Compare content
  if (typeof msg1.content === 'string' && typeof content2 === 'string') {
    return msg1.content === content2;
  }
  else if (typeof msg1.content === 'object' && typeof content2 === 'object') {
    try {
      // Use JSON.stringify to compare, but catch possible errors (e.g. circular reference)
      return JSON.stringify(msg1.content) === JSON.stringify(content2);
    }
    catch (error) {
      // If serialization fails, assume not same, avoid infinite loop
      console.warn('Error comparing messages:', error);
      return false;
    }
  }
  return false;
}
