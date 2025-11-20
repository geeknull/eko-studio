import React from 'react'
import { Tag, Typography, Space, Collapse } from 'antd'
import { StreamCallbackMessage } from '../../types'
import { LazySyntaxHighlighter } from '../base/LazySyntaxHighlighter'
import { WorkflowRenderer } from './renderers/WorkflowRenderer'
import { AgentStartRenderer } from './renderers/AgentStartRenderer'
import { AgentResultRenderer } from './renderers/AgentResultRenderer'
import { ThinkingRenderer } from './renderers/ThinkingRenderer'
import { ToolRenderer } from './renderers/ToolRenderer'
import { FinishRenderer } from './renderers/FinishRenderer'
import { FileRenderer } from './renderers/FileRenderer'
import { ErrorRenderer } from './renderers/ErrorRenderer'
import { DefaultRenderer } from './renderers/DefaultRenderer'

const { Text, Paragraph } = Typography

interface MessageRendererProps {
  content: StreamCallbackMessage
}

export const MessageRenderer: React.FC<MessageRendererProps> = React.memo(({ content }) => {
  const { agentName, type, taskId } = content

  // Select the corresponding renderer based on the message type
  const renderContent = () => {
    if (type === 'workflow') {
      return <WorkflowRenderer content={content} />
    }
    
    if (type === 'agent_start') {
      return <AgentStartRenderer content={content} />
    }
    
    if (type === 'agent_result') {
      return <AgentResultRenderer content={content as any} />
    }
    
    if (type === 'thinking' || type === 'text') {
      return <ThinkingRenderer content={content as any} />
    }
    
    if (type === 'tool_streaming' || type === 'tool_use' || type === 'tool_result' || type === 'tool_running') {
      return <ToolRenderer content={content as any} />
    }
    
    if (type === 'finish') {
      return <FinishRenderer content={content as any} />
    }
    
    if (type === 'file') {
      return <FileRenderer content={content as any} />
    }
    
    if (type === 'error') {
      return <ErrorRenderer content={content as any} />
    }
    
    // Fallback renderer: handle unknown types
    return <DefaultRenderer content={content} />
  }

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {/* Header information */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {agentName && (
          <Tag color="blue">agentName: {agentName}</Tag>
        )}
        {type && (
          <Tag color="purple">type: {type}</Tag>
        )}
        {taskId && (
          <div>
            <Text strong>taskId: </Text>
            <Text copyable>{taskId}</Text>
          </div>
        )}
      </div>
      
      {/* Message content rendering */}
      {renderContent()}
    </Space>
  )
})

MessageRenderer.displayName = 'MessageRenderer'

