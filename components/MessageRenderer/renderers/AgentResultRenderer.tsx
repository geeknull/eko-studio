import React from 'react'
import { Space, Typography, Tag, Divider, Alert } from 'antd'
import { CheckCircleOutlined, FileTextOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { WorkflowAgentCard } from '../../common/WorkflowAgentCard'
import { MarkdownRenderer } from '../../base/MarkdownRenderer'
import { LazySyntaxHighlighter } from '../../base/LazySyntaxHighlighter'
import type { StreamCallbackMessage } from '../../../types'

const { Text, Title, Paragraph } = Typography

interface AgentResultRendererProps {
  content: StreamCallbackMessage & {
    type: 'agent_result'
    agentNode: {
      name: string
      id: string
      dependsOn?: string[]
      task: string
      nodes: Array<{
        type: string
        text: string
        input?: string
        output?: string
      }>
      status: string
      parallel: boolean
      xml: string
    }
    result?: string
    error?: any
  }
}

/**
 * agent_result message renderer - renders message when Agent execution is complete and returns result
 */
export const AgentResultRenderer: React.FC<AgentResultRendererProps> = React.memo(({
  content
}) => {
  const { agentNode, result, error, nodeId } = content
  const hasError = error !== undefined && error !== null

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Agent info card */}
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '12px'
        }}>
          <Title level={5} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasError ? (
              <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
            ) : (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
            )}
            Agent Result
          </Title>
          <Tag color={hasError ? 'error' : 'success'}>
            {hasError ? 'failed' : 'completed'}
          </Tag>
        </div>

        {nodeId && (
          <div style={{ marginBottom: '12px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Node ID: </Text>
            <Text code style={{ fontSize: '12px' }}>{nodeId}</Text>
          </div>
        )}

        <WorkflowAgentCard agent={agentNode} />
      </div>

      {/* Divider */}
      <Divider style={{ margin: '8px 0' }} />

      {/* Error message (if exists) */}
      {hasError && (
        <Alert
          message={
            <Space>
              <WarningOutlined style={{ fontSize: '16px' }} />
              <Text strong>Agent Execution Error</Text>
            </Space>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {typeof error === 'string' ? (
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {error}
                </Paragraph>
              ) : error instanceof Error ? (
                <>
                  <div>
                    <Text strong>Message: </Text>
                    <Paragraph style={{ margin: 0 }}>{error.message}</Paragraph>
                  </div>
                  {error.stack && (
                    <div style={{
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid #ffccc7',
                      marginTop: '8px'
                    }}>
                      <LazySyntaxHighlighter
                        language="text"
                        shouldRender={true}
                      >
                        {error.stack}
                      </LazySyntaxHighlighter>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid #ffccc7'
                }}>
                  <LazySyntaxHighlighter
                    language="json"
                    shouldRender={true}
                  >
                    {JSON.stringify(error, null, 2)}
                  </LazySyntaxHighlighter>
                </div>
              )}
            </Space>
          }
          type="error"
          showIcon
        />
      )}

      {/* Agent execution result */}
      {result && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '12px'
          }}>
            <FileTextOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
            <Text strong style={{ fontSize: '14px' }}>result:</Text>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#f0f5ff',
            border: '1px solid #adc6ff'
          }}>
            <MarkdownRenderer content={result} />
          </div>
        </div>
      )}

      {/* If neither result nor error exists */}
      {!result && !hasError && (
        <Text type="secondary" italic>
          No result or error returned from agent
        </Text>
      )}
    </Space>
  )
})

AgentResultRenderer.displayName = 'AgentResultRenderer'

