import React from 'react';
import { Card, Typography, Space, Descriptions, Tag, Statistic, Row, Col } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import type { StreamCallbackMessage } from '../../../types';

const { Text } = Typography;

interface FinishRendererProps {
  content: StreamCallbackMessage & {
    type: 'finish'
    finishReason: string
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
}

/**
 * finish message renderer - renders task completion message
 * Displays finish reason and token usage
 */
export const FinishRenderer: React.FC<FinishRendererProps> = React.memo(({
  content,
}) => {
  const { finishReason, usage, nodeId } = content;

  return (
    <Card
      size="small"
      title={(
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
          <Text strong style={{ color: '#52c41a' }}>Task Finished</Text>
          <Tag color="success">completed</Tag>
        </Space>
      )}
      style={{
        backgroundColor: '#f6ffed',
        borderColor: '#b7eb8f',
      }}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        {/* Completion info */}
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label={<Text strong>Finish Reason</Text>}>
            <Tag color="blue">{finishReason}</Tag>
          </Descriptions.Item>

          {nodeId && (
            <Descriptions.Item label={<Text strong>Node ID</Text>}>
              <Text code style={{ fontSize: '12px' }}>
                {nodeId}
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Token usage statistics */}
        {usage && (
          <div>
            <Text strong style={{ marginBottom: '12px', display: 'block' }}>
              Token Usage:
            </Text>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fafafa' }}>
                  <Statistic
                    title="Prompt Tokens"
                    value={usage.promptTokens}
                    styles={{ value: { fontSize: '20px', color: '#1890ff' } }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fafafa' }}>
                  <Statistic
                    title="Completion Tokens"
                    value={usage.completionTokens}
                    styles={{ value: { fontSize: '20px', color: '#52c41a' } }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fafafa' }}>
                  <Statistic
                    title="Total Tokens"
                    value={usage.totalTokens}
                    styles={{ value: { fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' } }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* If usage is missing */}
        {!usage && (
          <Text type="secondary" italic>
            No token usage information
          </Text>
        )}
      </Space>
    </Card>
  );
});

FinishRenderer.displayName = 'FinishRenderer';
