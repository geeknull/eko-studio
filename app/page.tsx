"use client"

import React from 'react'
import { ConfigProvider, Layout, Card, Typography, Spin, Avatar, message } from 'antd'
import { Bubble, XProvider, Sender } from '@ant-design/x'
import { RobotOutlined } from '@ant-design/icons'
import { useChatStore, ChatMessage } from '@/store/chatStore'
import { useSSE } from '@/hooks/useSSE'
import { useMessageItems } from '@/hooks/useMessageItems'
import { JsonViewModal } from '@/components/base/JsonViewModal'

const { Header, Content } = Layout
const { Title } = Typography

function App() {
  const {  
    messages, 
    isLoading, 
    addUserMessage, 
    addAssistantMessage,
    setLoading
  } = useChatStore()
  const [inputValue, setInputValue] = React.useState('')
  const [selectedMessage, setSelectedMessage] = React.useState<ChatMessage | null>(null)
  
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

  // Callback for viewing JSON
  const handleViewJson = React.useCallback((message: ChatMessage) => {
    setSelectedMessage(message)
  }, [])
  
  // Close JSON view modal
  const handleCloseJsonModal = React.useCallback(() => {
    setSelectedMessage(null)
  }, [])

  // Use useMessageItems Hook to generate message list items
  const messageItems = useMessageItems(messages, { onViewJson: handleViewJson })

  const handleSend = async () => {
    if (!inputValue.trim()) return
    
    const userMessage = inputValue.trim()
    
    // Add user message
    addUserMessage(userMessage)
    setInputValue('')
    
    // Set loading state
    setLoading(true)
    
    try {
      // 1. Call API to start Agent
      const response = await fetch('/api/agent/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage }),
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
        
        // Connect to new SSE stream
        connect(`/api/agent/stream/${taskId}`)
      } else {
        throw new Error('Invalid response format: missing taskId')
      }
    } catch (error) {
      console.error('Failed to start agent:', error)
      setLoading(false)
      addAssistantMessage(`Error: Failed to start agent. ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <ConfigProvider>
      <XProvider>
        <Layout className="h-screen flex flex-col">
          <Header 
            className="bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0 h-16"
            style={{ backgroundColor: '#ffffff', paddingLeft: '24px', paddingRight: '24px' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <RobotOutlined style={{ fontSize: '20px', color: 'white' }} />
              </div>
              <Title level={4} className="!mb-0 !text-gray-800" style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>
                Eko Studio
              </Title>
            </div>
          </Header>
          <Content className="flex-1 flex flex-col overflow-hidden p-6 min-h-0" style={{ minHeight: 0 }}>
            <Card 
              className="flex-1 flex flex-col overflow-hidden min-h-0" 
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, padding: 0 } }}
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
                  roles={{
                    user: {
                      placement: 'end',
                    },
                    assistant: {
                      placement: 'start',
                    },
                  }}
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
          </Content>
        </Layout>
      </XProvider>
      
      {/* JSON View Modal */}
      <JsonViewModal
        open={!!selectedMessage}
        message={selectedMessage}
        onClose={handleCloseJsonModal}
      />
    </ConfigProvider>
  )
}

export default App
