"use client"

import React from 'react'
import { Card, Avatar, Spin, message } from 'antd'
import { Bubble, Sender, XProvider } from '@ant-design/x'
import { RobotOutlined } from '@ant-design/icons'
import { useChatStore, ChatMessage } from '@/store/chatStore'
import { useConfigStore } from '@/store'
import { useSSE } from '@/hooks/useSSE'
import { useMessageItems } from '@/hooks/useMessageItems'

interface AgentChatProps {
  onViewJson: (message: ChatMessage) => void
  onConfigRequired?: () => void
}

export const AgentChat: React.FC<AgentChatProps> = ({
  onViewJson,
  onConfigRequired,
}) => {
  const { mode, normalConfig, replayConfig } = useConfigStore()
  const {
    messages,
    isLoading,
    addUserMessage,
    addAssistantMessage,
    setLoading,
  } = useChatStore()
  const [inputValue, setInputValue] = React.useState('')

  // Use SSE Hook
  const { isConnected, connect, disconnect } = useSSE({
    url: '', // Dynamic connection, initially empty
    onDisconnect: () => {
      setLoading(false)
    },
    onError: (error) => {
      setLoading(false)
      console.error('SSE Error:', error)
      message.error('Connection interrupted, please retry')
    },
  })

  // Use useMessageItems Hook to generate message list items
  const messageItems = useMessageItems(messages, { onViewJson })

  const handleSend = async () => {
    if (!inputValue.trim()) return

    // Check if normal mode requires config
    if (mode === 'normal' && !normalConfig) {
      message.warning('Please configure Normal mode parameters first')
      onConfigRequired?.()
      return
    }

    const userMessage = inputValue.trim()

    // Add user message
    addUserMessage(userMessage)
    setInputValue('')

    // Set loading state
    setLoading(true)

    try {
      // 1. Call API to start Agent
      const requestBody: Record<string, unknown> = { query: userMessage }

      // Add normal config if in normal mode
      if (mode === 'normal' && normalConfig) {
        requestBody.normalConfig = normalConfig
      }

      const response = await fetch('/api/agent/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data && data.data.taskId) {
        const taskId = data.data.taskId

        // 2. Use returned taskId to establish SSE connection
        // If already connected, disconnect first
        if (isConnected) {
          disconnect()
        }

        // Build SSE URL with mode and replay parameters
        let sseUrl = `/api/agent/stream/${taskId}?mode=${mode}`

        if (mode === 'replay') {
          sseUrl += `&playbackMode=${replayConfig.playbackMode}`
          if (replayConfig.playbackMode === 'realtime') {
            sseUrl += `&speed=${replayConfig.speed}`
          } else {
            sseUrl += `&fixedInterval=${replayConfig.fixedInterval}`
          }
        }

        // Connect to new SSE stream
        connect(sseUrl)
      } else {
        throw new Error('Invalid response format: missing taskId')
      }
    } catch (error) {
      console.error('Failed to start agent:', error)
      setLoading(false)
      addAssistantMessage(
        `Error: Failed to start agent. ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return (
    <XProvider>
      <Card
        className="flex-1 flex flex-col overflow-hidden min-h-0"
        styles={{
          body: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
            padding: 0,
          },
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 p-4">
            No messages yet, start chatting!
          </div>
        ) : (
          <Bubble.List
            className="flex-1 overflow-y-auto p-4"
            style={{ minHeight: 0 }}
            autoScroll
            items={messageItems}
          />
        )}
        {isLoading && (
          <div className="flex justify-start gap-3 p-4 border-t">
            <Avatar icon={<RobotOutlined />} />
            <div>
              <Spin size="small" />
            </div>
          </div>
        )}
        <div className="border-t pt-4 flex-shrink-0 px-4">
          <Sender
            value={inputValue}
            onChange={setInputValue}
            onSubmit={(message) => {
              if (message.trim()) {
                handleSend()
              }
            }}
            onCancel={() => {
              if (isLoading) {
                // Handle cancel/stop logic here if needed
                setLoading(false)
              }
            }}
            placeholder="Type a message..."
            loading={isLoading}
            disabled={isLoading}
            submitType="enter"
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </div>
      </Card>
    </XProvider>
  )
}

