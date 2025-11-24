"use client"

import React from 'react'
import { Avatar, Tag, Button, Space } from 'antd'
import { UserOutlined, RobotOutlined, EyeOutlined } from '@ant-design/icons'
import { ChatMessage } from '@/store/chatStore'
import { StreamCallbackMessage } from '@/types'
import { MessageRenderer } from '@/components/message-renderer'

interface UseMessageItemsOptions {
  onViewJson?: (message: ChatMessage) => void
}

export const useMessageItems = (
  messages: ChatMessage[],
  options?: UseMessageItemsOptions
) => {
  const { onViewJson } = options || {}

  return React.useMemo(() => messages.map((message) => ({
    key: message.id,
    role: message.role,
    content: message.content,
    avatar: <Avatar icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />} />,
    contentRender: message.type === 'eko' && typeof message.content !== 'string'
      ? (content: any) => <MessageRenderer content={content as StreamCallbackMessage} />
      : undefined,
    footer: (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '4px'
      }}>
        <Space size="small">
          <Tag color="default" style={{ margin: 0, fontSize: '11px', padding: '2px 8px' }}>
            Sequence: {message.id}
          </Tag>
          {message.repeat && message.repeat > 1 && (
            <Tag color="processing" style={{ margin: 0, fontSize: '11px', padding: '2px 8px' }}>
              × {message.repeat}
            </Tag>
          )}
        </Space>
        {onViewJson && (
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewJson(message)}
            style={{ fontSize: '11px', padding: '0 4px', height: 'auto' }}
          >
            View JSON
          </Button>
        )}
      </div>
    ),
    styles: {
      footer: {
        marginTop: '4px',
        paddingTop: 0,
      },
    },
  })), [messages, onViewJson])
}
