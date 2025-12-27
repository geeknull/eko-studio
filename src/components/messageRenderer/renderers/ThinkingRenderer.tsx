import React from 'react';
import { Tag, Typography } from 'antd';
import { LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { MarkdownRenderer } from '../../base/MarkdownRenderer';
import type { StreamCallbackMessage } from '../../../types';

const { Text } = Typography;

interface ThinkingRendererProps {
  content: StreamCallbackMessage & { type: 'thinking' | 'text', text: string }
}

/**
 * thinking/text message renderer - renders AI thinking process and text messages
 */
export const ThinkingRenderer: React.FC<ThinkingRendererProps> = React.memo(({
  content,
}) => {
  const { text, streamId, streamDone, nodeId, type } = content;

  return (
    <div>
      {/* Metadata info */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
        {streamId && (
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>streamId: </Text>
            <Text style={{ fontSize: '12px', fontFamily: 'monospace' }}>{streamId}</Text>
          </div>
        )}
        {nodeId && (
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>nodeId: </Text>
            <Text style={{ fontSize: '12px', fontFamily: 'monospace' }}>{nodeId}</Text>
          </div>
        )}
        {streamDone !== undefined && (
          <Tag
            color={streamDone ? 'success' : 'processing'}
            icon={streamDone ? <CheckCircleOutlined /> : <LoadingOutlined />}
          >
            {streamDone ? 'completed' : (type === 'thinking' ? 'thinking...' : 'streaming...')}
          </Tag>
        )}
      </div>

      {/* Markdown content */}
      {text && (
        <div style={{
          backgroundColor: '#fafafa',
          border: '1px solid #e8e8e8',
          borderRadius: '4px',
          padding: '16px',
          marginTop: '8px',
        }}
        >
          <MarkdownRenderer content={text} />
        </div>
      )}
    </div>
  );
});

ThinkingRenderer.displayName = 'ThinkingRenderer';
