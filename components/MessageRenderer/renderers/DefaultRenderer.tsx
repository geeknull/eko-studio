import React from 'react'
import { Typography, Alert, Collapse } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { LazySyntaxHighlighter } from '../../base/LazySyntaxHighlighter'
import type { StreamCallbackMessage } from '../../../types'

const { Text, Paragraph } = Typography

interface DefaultRendererProps {
  content: StreamCallbackMessage
}

/**
 * Default message renderer - fallback for unknown message types
 */
export const DefaultRenderer: React.FC<DefaultRendererProps> = React.memo(({ 
  content 
}) => {
  const [jsonExpanded, setJsonExpanded] = React.useState<string[]>([])
  
  // Extract text content from message (if any)
  const hasTextContent = 'text' in content && content.text
  const textContent = hasTextContent ? (content as any).text : null

  // Filter out basic fields, show only special content
  const contentWithoutBasicFields = { ...content }
  delete (contentWithoutBasicFields as any).taskId
  delete (contentWithoutBasicFields as any).agentName
  delete (contentWithoutBasicFields as any).type
  delete (contentWithoutBasicFields as any).nodeId

  const hasAdditionalContent = Object.keys(contentWithoutBasicFields).length > 0

  return (
    <div>
      {/* Hint message */}
      <Alert
        message={
          <span>
            <InfoCircleOutlined style={{ marginRight: '8px' }} />
            Unknown message type: <Text code>{content.type}</Text>
          </span>
        }
        description="No dedicated renderer for this message type, displaying in default mode"
        type="info"
        showIcon={false}
        style={{ marginBottom: '16px' }}
      />

      {/* If text content exists, show it first */}
      {textContent && (
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Content:</Text>
          <Paragraph 
            style={{ 
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#fafafa',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {textContent}
          </Paragraph>
        </div>
      )}

      {/* Raw data display */}
      {hasAdditionalContent && (
        <div>
          <Collapse
            size="small"
            ghost
            activeKey={jsonExpanded}
            onChange={(keys) => setJsonExpanded(keys as string[])}
            items={[
              {
                key: 'raw-data',
                label: <Text strong>Raw Message Data</Text>,
                children: (
                  <div style={{ borderRadius: '4px', overflow: 'hidden' }}>
                    <LazySyntaxHighlighter
                      language="json"
                      shouldRender={jsonExpanded.includes('raw-data')}
                    >
                      {JSON.stringify(content, null, 2)}
                    </LazySyntaxHighlighter>
                  </div>
                )
              }
            ]}
          />
        </div>
      )}

      {/* If neither text content nor additional data exists, show empty message hint */}
      {!textContent && !hasAdditionalContent && (
        <Text type="secondary">No content available for this message</Text>
      )}
    </div>
  )
})

DefaultRenderer.displayName = 'DefaultRenderer'

