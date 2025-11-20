import { create } from 'zustand'
import { StreamCallbackMessage } from '../types'
import { 
  shouldMergeByAgentNameAndType,
  mergeMessagesByAgentNameAndType,
  shouldMergeByWorkflowTaskId, 
  mergeMessagesByWorkflowTaskId, 
  isSameMessage 
} from './messageMerger'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string | StreamCallbackMessage
  type?: 'eko' | string
  timestamp?: number
  repeat?: number
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  currentStreamingId: string | null
  nextMessageId: number
  addMessage: (message: ChatMessage) => void
  addUserMessage: (content: string) => void
  addAssistantMessage: (content: string | StreamCallbackMessage) => void
  appendToMessage: (id: string, content: string) => void
  updateStreamCallbackMessage: (id: string, content: string | StreamCallbackMessage) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setStreamingId: (id: string | null) => void
}

// Message queue: ensures messages are processed in arrival order
const messageQueue: Array<string | StreamCallbackMessage> = []
let isProcessing = false
let processingTimer: ReturnType<typeof setTimeout> | null = null

// Queue configuration
const QUEUE_CONFIG = {
  BATCH_SIZE_NORMAL: 5,           // Messages per batch in normal conditions
  BATCH_SIZE_LARGE: 20,           // Messages per batch when backlog exists
  BATCH_SIZE_HUGE: 50,            // Messages per batch when severe backlog exists
  PROCESSING_INTERVAL: 16,        // Processing interval (ms)
  THRESHOLD_LARGE: 100,           // Backlog threshold for large batches
  THRESHOLD_HUGE: 500,            // Backlog threshold for huge batches
  LOG_INTERVAL: 50,               // Log every N processed messages
}

// Declare function reference (assigned later)
let processNextMessage: () => void

// Statistics
let totalProcessed = 0  // Total messages processed

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  currentStreamingId: null,
  nextMessageId: 1,
  
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  
  addUserMessage: (content) =>
    set((state) => {
      const messageId = state.nextMessageId.toString()
      return {
        messages: [
          ...state.messages,
          {
            id: messageId,
            role: 'assistant',
            content,
          },
        ],
        nextMessageId: state.nextMessageId + 1,
      }
    }),
  
  addAssistantMessage: (content) => {
    // Add message to queue (no length limit, consume slowly)
    messageQueue.push(content)
    
    // Queue length hint (informational only)
    if (messageQueue.length % 100 === 0) {
      console.log(`📊 Queue status: pending ${messageQueue.length}, processed ${totalProcessed}`)
    }
    
    // Schedule processing (debounce to avoid frequent triggers)
    if (!processingTimer) {
      processingTimer = setTimeout(() => {
        processingTimer = null
        // Since setTimeout is async, processNextMessage is defined by execution time
        processNextMessage()
      }, 0)
    }
  },
  
  appendToMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === id) {
          // If current content is string, append string
          if (typeof msg.content === 'string') {
            return { ...msg, content: msg.content + content }
          }
          // If current content is object, cannot append, return original
          return msg
        }
        return msg
      }),
    })),
  
  updateStreamCallbackMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    })),
  
  clearMessages: () => {
    // Clear queue and stats
    messageQueue.length = 0
    totalProcessed = 0
    isProcessing = false
    if (processingTimer) {
      clearTimeout(processingTimer)
      processingTimer = null
    }
    console.log('🔄 Messages and queue cleared')
    
    set({
      messages: [],
      isLoading: false,
      currentStreamingId: null,
      nextMessageId: 1,
    })
  },
  
  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),
  
  setStreamingId: (id) =>
    set({
      currentStreamingId: id,
    }),
}))

// Core logic for processing a single message
const processSingleMessage = (content: string | StreamCallbackMessage) => {
  useChatStore.setState((state) => {
    if (state.messages.length === 0) {
      const messageId = state.nextMessageId.toString()
      return {
        messages: [
          {
            id: messageId,
            role: 'assistant' as const,
            type: 'eko',
            content,
            repeat: 1,
          },
        ],
        currentStreamingId: messageId,
        nextMessageId: state.nextMessageId + 1,
      }
    }

    const lastMessage = state.messages[state.messages.length - 1]
    
    // 1. If last message and new message are identical, increase repeat count
    if (isSameMessage(lastMessage, content)) {
      const newRepeat = (lastMessage.repeat || 1) + 1
      return {
        messages: state.messages.map((msg, index) => 
          index === state.messages.length - 1
            ? { ...msg, repeat: newRepeat }
            : msg
        ),
        currentStreamingId: lastMessage.id,
      }
    }
    
    // 2. Check for merge by same agentName and type combination
    if (shouldMergeByAgentNameAndType(lastMessage, content)) {
      const mergedMessage = mergeMessagesByAgentNameAndType(
        lastMessage,
        content as StreamCallbackMessage
      )
      
      return {
        messages: state.messages.map((msg, index) => 
          index === state.messages.length - 1 ? mergedMessage : msg
        ),
        currentStreamingId: lastMessage.id,
      }
    }
    
    // 3. Check for merge by same workflow.taskId
    if (shouldMergeByWorkflowTaskId(lastMessage, content)) {
      const mergedMessage = mergeMessagesByWorkflowTaskId(
        lastMessage,
        content as StreamCallbackMessage
      )
      
      return {
        messages: state.messages.map((msg, index) => 
          index === state.messages.length - 1 ? mergedMessage : msg
        ),
        currentStreamingId: lastMessage.id,
      }
    }
    
    // 4. Otherwise add new message
    const messageId = state.nextMessageId.toString()
    return {
      messages: [
        ...state.messages,
        {
          id: messageId,
          role: 'assistant' as const,
          type: 'eko',
          content,
          repeat: 1,
        },
      ],
      currentStreamingId: messageId,
      nextMessageId: state.nextMessageId + 1,
    }
  })
}

// Dynamically determine batch size based on queue length
const getBatchSize = (queueLength: number): number => {
  if (queueLength >= QUEUE_CONFIG.THRESHOLD_HUGE) {
    return QUEUE_CONFIG.BATCH_SIZE_HUGE  // Severe backlog, huge batch
  } else if (queueLength >= QUEUE_CONFIG.THRESHOLD_LARGE) {
    return QUEUE_CONFIG.BATCH_SIZE_LARGE  // Backlog, large batch
  } else {
    return QUEUE_CONFIG.BATCH_SIZE_NORMAL  // Normal, small batch
  }
}

// Process messages in queue (batch processing)
processNextMessage = () => {
  if (isProcessing || messageQueue.length === 0) {
    return
  }
  
  isProcessing = true
  
  try {
    const queueLength = messageQueue.length
    const batchSize = getBatchSize(queueLength)
    
    // Batch process multiple messages (reduce renders)
    let processedCount = 0
    while (messageQueue.length > 0 && processedCount < batchSize) {
      const content = messageQueue.shift()!
      processSingleMessage(content)
      processedCount++
      totalProcessed++
    }
    
    // Log progress periodically
    if (totalProcessed % QUEUE_CONFIG.LOG_INTERVAL === 0 || messageQueue.length === 0) {
      const status = queueLength >= QUEUE_CONFIG.THRESHOLD_HUGE ? '🔴 Severe Backlog' 
                   : queueLength >= QUEUE_CONFIG.THRESHOLD_LARGE ? '🟡 Backlog' 
                   : '🟢 Normal'
      console.log(`${status} Batch: ${processedCount} msgs | Batch Size: ${batchSize} | Queue Left: ${messageQueue.length} | Total Processed: ${totalProcessed}`)
    }
  } finally {
    isProcessing = false
    
    // If queue still has messages, continue processing
    if (messageQueue.length > 0) {
      // Use requestAnimationFrame to let browser process in next frame
      // Avoid blocking UI rendering
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => processNextMessage())
      } else {
        setTimeout(processNextMessage, QUEUE_CONFIG.PROCESSING_INTERVAL)
      }
    } else {
      // Log summary when queue is empty
      console.log(`✅ Queue cleared, total processed ${totalProcessed} messages`)
    }
  }
}

// Expose store to window object in development for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).chatStore = useChatStore
  console.log('💡 Dev Mode: chatStore mounted to window.chatStore, usage:')
  console.log('  - window.chatStore.getState() // Get current state')
  console.log('  - window.chatStore.getState().messages // Get message list')
  console.log('  - window.chatStore.getState().clearMessages() // Clear messages')
}
