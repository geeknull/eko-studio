import React from 'react'
import { Alert, Typography, Space, Collapse, Descriptions } from 'antd'
import { CloseCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { LazySyntaxHighlighter } from '../../base/LazySyntaxHighlighter'
import type { StreamCallbackMessage } from '../../../types'

const { Text, Paragraph } = Typography

interface ErrorRendererProps {
  content: StreamCallbackMessage & {
    type: 'error'
    error: unknown
  }
}

/**
 * error message renderer - renders error messages
 */
export const ErrorRenderer: React.FC<ErrorRendererProps> = React.memo(({
  content
}) => {
  const { error, nodeId } = content

  // Parse error information
  const errorInfo = React.useMemo(() => {
    // Standard Error object
    if (error instanceof Error) {
      return {
        type: 'Error',
        message: error.message,
        name: error.name,
        stack: error.stack,
        isError: true
      }
    }

    // String error
    if (typeof error === 'string') {
      return {
        type: 'String',
        message: error,
        isError: false
      }
    }

    // Object error
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any
      return {
        type: 'Object',
        message: errorObj.message || errorObj.error || JSON.stringify(error),
        name: errorObj.name,
        code: errorObj.code,
        details: error,
        isError: false
      }
    }

    // Other types
    return {
      type: typeof error,
      message: String(error),
      isError: false
    }
  }, [error])

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Error alert */}
      <Alert
        message={
          <Space>
            <CloseCircleOutlined style={{ fontSize: '16px' }} />
            <Text strong>Error Occurred</Text>
          </Space>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {errorInfo.name && errorInfo.name !== 'Error' && (
              <div>
                <Text strong>Type: </Text>
                <Text code>{errorInfo.name}</Text>
              </div>
            )}
            
            <div>
              <Text strong>Message: </Text>
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {errorInfo.message}
              </Paragraph>
            </div>

            {errorInfo.code && (
              <div>
                <Text strong>Code: </Text>
                <Text code>{errorInfo.code}</Text>
              </div>
            )}

            {nodeId && (
              <div>
                <Text strong>Node ID: </Text>
                <Text code style={{ fontSize: '12px' }}>{nodeId}</Text>
              </div>
            )}
          </Space>
        }
        type="error"
        showIcon
        icon={<WarningOutlined />}
      />

      {/* Detailed info (collapsible) */}
      {(errorInfo.stack || errorInfo.details) && (
        <Collapse 
          size="small" 
          ghost
          items={[
            // Stack Trace
            ...(errorInfo.stack ? [{
              key: 'stack',
              label: <Text strong>Stack Trace</Text>,
              children: (
                <div style={{
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid #ffccc7'
                }}>
                  <LazySyntaxHighlighter
                    language="text"
                    shouldRender={true}
                  >
                    {errorInfo.stack}
                  </LazySyntaxHighlighter>
                </div>
              )
            }] : []),
            
            // Raw Error Object
            ...(errorInfo.details ? [{
              key: 'details',
              label: <Text strong>Raw Error Data</Text>,
              children: (
                <div style={{
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid #ffccc7'
                }}>
                  <LazySyntaxHighlighter
                    language="json"
                    shouldRender={true}
                  >
                    {JSON.stringify(errorInfo.details, null, 2)}
                  </LazySyntaxHighlighter>
                </div>
              )
            }] : [])
          ]}
        />
      )}
    </Space>
  )
})

ErrorRenderer.displayName = 'ErrorRenderer'

