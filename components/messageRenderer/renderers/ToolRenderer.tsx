import React from 'react';
import { Card, Typography, Space, Tag, Descriptions } from 'antd';
import { ApiOutlined, ThunderboltOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { LazySyntaxHighlighter } from '../../base/LazySyntaxHighlighter';
import { MarkdownRenderer } from '../../base/MarkdownRenderer';
import type { StreamCallbackMessage } from '../../../types';

const { Text } = Typography;

interface ToolRendererProps {
  content: StreamCallbackMessage & {
    type: 'tool_streaming' | 'tool_use' | 'tool_result' | 'tool_running'
    toolId: string
    toolName: string
    paramsText?: string // tool_streaming 使用
    params?: Record<string, any> // tool_use, tool_result 使用
    toolResult?: { // tool_result 使用
      content: Array<{
        type: string
        text: string
      }>
    }
    text?: string // tool_running 使用
    streamId?: string // tool_running 使用
    streamDone?: boolean // tool_running 使用
  }
}

/**
 * Tool message renderer - renders tool call related messages
 *
 * - tool_streaming: Tool is being called (streaming notification)
 * - tool_running: Tool is running (output stream)
 * - tool_use: Tool has been used/called
 * - tool_result: Tool call result
 */
export const ToolRenderer: React.FC<ToolRendererProps> = React.memo(({
  content,
}) => {
  const { toolId, toolName, paramsText, params, nodeId, type, toolResult, text, streamId, streamDone } = content;
  const [paramsExpanded, setParamsExpanded] = React.useState<boolean>(true);
  const [resultExpanded, setResultExpanded] = React.useState<boolean>(true);

  // Unify handling of two parameter formats
  const formattedParams = React.useMemo(() => {
    // tool_use, tool_result use params object
    if (params) {
      return JSON.stringify(params, null, 2);
    }

    // tool_streaming uses paramsText string
    if (paramsText) {
      try {
        const parsed = JSON.parse(paramsText);
        return JSON.stringify(parsed, null, 2);
      }
      catch (e) {
        return paramsText; // Return original text if not valid JSON
      }
    }

    return null;
  }, [params, paramsText]);

  // Format toolResult
  const formattedResult = React.useMemo(() => {
    if (!toolResult || !toolResult.content) return null;

    // Extract all text content
    const textContents = toolResult.content
      .filter(item => item.type === 'text')
      .map(item => item.text);

    if (textContents.length === 0) return null;

    // Try to parse as JSON
    const allText = textContents.join('\n');
    try {
      const parsed = JSON.parse(allText);
      return JSON.stringify(parsed, null, 2);
    }
    catch (e) {
      return allText; // Return original text if not JSON
    }
  }, [toolResult]);

  return (
    <Card
      size="small"
      title={(
        <Space>
          <ApiOutlined style={{ color: '#1890ff' }} />
          <Text strong>Tool Call</Text>
          {type === 'tool_streaming'
            ? (
              <Tag color="processing" icon={<ThunderboltOutlined />}>
                calling...
              </Tag>
            )
            : type === 'tool_running'
              ? (
                <Tag
                  color={streamDone ? 'success' : 'processing'}
                  icon={streamDone ? <CheckCircleOutlined /> : <LoadingOutlined />}
                >
                  {streamDone ? 'run completed' : 'running...'}
                </Tag>
              )
              : type === 'tool_use'
                ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    executed
                  </Tag>
                )
                : (
                  <Tag color="cyan" icon={<CheckCircleOutlined />}>
                    result
                  </Tag>
                )}
        </Space>
      )}
      style={{
        backgroundColor: '#f6ffed',
        borderColor: '#b7eb8f',
      }}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        {/* Tool info */}
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label={<Text strong>Tool Name</Text>}>
            <Tag color="blue">{toolName}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label={<Text strong>Tool ID</Text>}>
            <Text copyable code style={{ fontSize: '12px' }}>
              {toolId}
            </Text>
          </Descriptions.Item>

          {nodeId && (
            <Descriptions.Item label={<Text strong>Node ID</Text>}>
              <Text code style={{ fontSize: '12px' }}>
                {nodeId}
              </Text>
            </Descriptions.Item>
          )}

          {streamId && (
            <Descriptions.Item label={<Text strong>Stream ID</Text>}>
              <Text code style={{ fontSize: '12px' }}>
                {streamId}
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Text output for tool_running */}
        {type === 'tool_running' && text && (
          <div>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>
              text:
            </Text>
            <div style={{
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: '#f0f2f5',
              border: '1px solid #e6e6e6',
            }}
            >
              <MarkdownRenderer content={text} />
            </div>
          </div>
        )}

        {/* Parameters display */}
        {formattedParams && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
            >
              <Text strong>
                {type === 'tool_streaming' ? 'paramsText:' : 'params:'}
              </Text>
              <Tag
                color="default"
                style={{ cursor: 'pointer' }}
                onClick={() => setParamsExpanded(!paramsExpanded)}
              >
                {paramsExpanded ? 'Collapse' : 'Expand'}
              </Tag>
            </div>

            {paramsExpanded && (
              <div style={{
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #d9d9d9',
              }}
              >
                <LazySyntaxHighlighter
                  language="json"
                  shouldRender={paramsExpanded}
                >
                  {formattedParams}
                </LazySyntaxHighlighter>
              </div>
            )}
          </div>
        )}

        {/* If no parameters */}
        {!formattedParams && (
          <Text type="secondary" italic>
            No parameters provided
          </Text>
        )}

        {/* Tool result display (unique to tool_result) */}
        {formattedResult && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
            >
              <Text strong>Result:</Text>
              <Tag
                color="default"
                style={{ cursor: 'pointer' }}
                onClick={() => setResultExpanded(!resultExpanded)}
              >
                {resultExpanded ? 'Collapse' : 'Expand'}
              </Tag>
            </div>

            {resultExpanded && (
              <div style={{
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #e8e8e8',
              }}
              >
                <LazySyntaxHighlighter
                  language="json"
                  shouldRender={resultExpanded}
                >
                  {formattedResult}
                </LazySyntaxHighlighter>
              </div>
            )}
          </div>
        )}
      </Space>
    </Card>
  );
});

ToolRenderer.displayName = 'ToolRenderer';
