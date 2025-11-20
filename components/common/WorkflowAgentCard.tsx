import React from 'react'
import { Tag, Typography, Space, Collapse, Card } from 'antd'
import { LazySyntaxHighlighter } from '../base/LazySyntaxHighlighter'
import type { WorkflowAgent, WorkflowNode, WorkflowTextNode, WorkflowForEachNode, WorkflowWatchNode } from '../../types'

const { Text, Paragraph } = Typography

// Component for rendering a single node
export const NodeRenderer: React.FC<{
  node: WorkflowNode;
  level?: number;
  isSequential?: boolean;
  index?: number;
  showConnector?: boolean;
  parentIndex?: string;
}> = ({ node, level = 0, isSequential = false, index, showConnector = false, parentIndex }) => {
  const indent = level * 16

  // Generate display index: if parent index exists, use "parent.child" format, otherwise use single number
  const displayIndex = parentIndex && index !== undefined
    ? `${parentIndex}.${index + 1}`
    : index !== undefined
      ? `${index + 1}`
      : undefined

  // Determine if it's a single digit (used to decide whether to show circle or rounded rectangle)
  const isSingleDigit = displayIndex && !displayIndex.includes('.')

  if (node.type === 'normal') {
    const normalNode = node as WorkflowTextNode
    return (
      <div style={{ position: 'relative' }}>
        {showConnector && (
          <div style={{
            position: 'absolute',
            left: isSingleDigit ? '12px' : '14px',
            top: '-8px',
            bottom: '8px',
            width: '2px',
            backgroundColor: '#d9d9d9'
          }} />
        )}
        <div style={{ marginLeft: `${indent}px`, marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {isSequential && displayIndex && (
            <div style={{
              minWidth: isSingleDigit ? '24px' : '28px',
              height: '24px',
              borderRadius: isSingleDigit ? '50%' : '12px',
              backgroundColor: '#1890ff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isSingleDigit ? '12px' : '11px',
              fontWeight: 'bold',
              zIndex: 1,
              padding: isSingleDigit ? '0' : '0 6px'
            }}>
              {displayIndex}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div>
              <Tag color="default">normal</Tag>
              <Text>{normalNode.text}</Text>
            </div>
            {normalNode.input && (
              <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                <Text type="secondary">input: </Text>
                <Text code>{normalNode.input}</Text>
              </div>
            )}
            {normalNode.output && (
              <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                <Text type="secondary">output: </Text>
                <Text code>{normalNode.output}</Text>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (node.type === 'forEach') {
    const forEachNode = node as WorkflowForEachNode
    return (
      <div style={{ position: 'relative' }}>
        {showConnector && (
          <div style={{
            position: 'absolute',
            left: isSingleDigit ? '12px' : '14px',
            top: '-8px',
            bottom: '8px',
            width: '2px',
            backgroundColor: '#d9d9d9'
          }} />
        )}
        <div style={{ marginLeft: `${indent}px`, marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {isSequential && displayIndex && (
            <div style={{
              minWidth: isSingleDigit ? '24px' : '28px',
              height: '24px',
              borderRadius: isSingleDigit ? '50%' : '12px',
              backgroundColor: '#1890ff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isSingleDigit ? '12px' : '11px',
              fontWeight: 'bold',
              zIndex: 1,
              padding: isSingleDigit ? '0' : '0 6px'
            }}>
              {displayIndex}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: '#fafafa'
            }}>
              <div>
                <Tag color="blue">forEach</Tag>
                <Text type="secondary">items: </Text>
                <Text code>{forEachNode.items}</Text>
              </div>
              {forEachNode.nodes && forEachNode.nodes.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>nested nodes:</Text>
                  <div style={{ marginTop: '4px', marginLeft: '16px', paddingLeft: '8px', borderLeft: '2px solid #e8e8e8' }}>
                    {forEachNode.nodes.map((subNode, idx) => (
                      <NodeRenderer
                        key={idx}
                        node={subNode}
                        level={0}
                        isSequential={isSequential}
                        index={idx}
                        showConnector={isSequential && idx > 0}
                        parentIndex={displayIndex}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (node.type === 'watch') {
    const watchNode = node as WorkflowWatchNode
    return (
      <div style={{ position: 'relative' }}>
        {showConnector && (
          <div style={{
            position: 'absolute',
            left: isSingleDigit ? '12px' : '14px',
            top: '-8px',
            bottom: '8px',
            width: '2px',
            backgroundColor: '#d9d9d9'
          }} />
        )}
        <div style={{ marginLeft: `${indent}px`, marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {isSequential && displayIndex && (
            <div style={{
              minWidth: isSingleDigit ? '24px' : '28px',
              height: '24px',
              borderRadius: isSingleDigit ? '50%' : '12px',
              backgroundColor: '#1890ff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isSingleDigit ? '12px' : '11px',
              fontWeight: 'bold',
              zIndex: 1,
              padding: isSingleDigit ? '0' : '0 6px'
            }}>
              {displayIndex}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: '#fafafa'
            }}>
              <div>
                <Tag color="orange">watch</Tag>
                <Text type="secondary">event: </Text>
                <Text code>{watchNode.event}</Text>
                {watchNode.loop && <Tag color="purple">loop</Tag>}
              </div>
              {watchNode.description && (
                <div style={{ marginTop: '4px' }}>
                  <Text>{watchNode.description}</Text>
                </div>
              )}
              {watchNode.triggerNodes && watchNode.triggerNodes.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>trigger nodes:</Text>
                  <div style={{ marginTop: '4px', marginLeft: '16px', paddingLeft: '8px', borderLeft: '2px solid #e8e8e8' }}>
                    {watchNode.triggerNodes.map((triggerNode, idx) => (
                      <NodeRenderer
                        key={idx}
                        node={triggerNode}
                        level={0}
                        isSequential={isSequential}
                        index={idx}
                        showConnector={isSequential && idx > 0}
                        parentIndex={displayIndex}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginLeft: `${indent}px`, marginBottom: '8px' }}>
      <Text type="secondary">{JSON.stringify(node)}</Text>
    </div>
  )
}

NodeRenderer.displayName = 'NodeRenderer'

interface WorkflowAgentCardProps {
  agent: WorkflowAgent
  agentsMap?: Map<string, WorkflowAgent>
}

/**
 * WorkflowAgent Card Component - Used to render detailed information of a single agent
 */
export const WorkflowAgentCard: React.FC<WorkflowAgentCardProps> = React.memo(({ 
  agent, 
  agentsMap 
}) => {
  const [agentXmlExpanded, setAgentXmlExpanded] = React.useState<string[]>([])
  const agentXmlKey = `agent-${agent.id}-xml`

  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>{agent.name}</Text>
          <Tag color={
            agent.status === 'done' ? 'success' :
            agent.status === 'running' ? 'processing' :
            agent.status === 'error' ? 'error' :
            'default'
          }>
            {agent.status}
          </Tag>
          {agent.parallel !== undefined && (
            <Tag color={agent.parallel ? 'blue' : 'default'}>
              {agent.parallel ? 'parallel' : 'sequential'}
            </Tag>
          )}
        </Space>
      }
      style={{ width: '100%' }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div>
          <Text type="secondary">id: </Text>
          <Text copyable>{agent.id}</Text>
        </div>
        
        {agent.dependsOn && agent.dependsOn.length > 0 && (
          <div>
            <Text type="secondary">dependsOn: </Text>
            <Space size="small" wrap>
              {agent.dependsOn.map((dep, idx) => {
                const depAgent = agentsMap?.get(dep)
                return (
                  <Tag key={idx}>
                    {dep}{depAgent ? ` (${depAgent.name})` : ''}
                  </Tag>
                )
              })}
            </Space>
          </div>
        )}
        
        <div>
          <Text type="secondary">task:</Text>
          <Paragraph style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
            {agent.task}
          </Paragraph>
        </div>
        
        {agent.nodes && agent.nodes.length > 0 && (
          <div>
            <Text type="secondary">
              nodes ({agent.nodes.length})
              {agent.parallel === false && <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>(sequential execution)</Text>}
            </Text>
            <div style={{ marginTop: '8px' }}>
              {agent.nodes.map((node, nodeIdx) => (
                <NodeRenderer 
                  key={nodeIdx} 
                  node={node} 
                  isSequential={agent.parallel === false}
                  index={nodeIdx}
                  showConnector={agent.parallel === false && nodeIdx > 0}
                />
              ))}
            </div>
          </div>
        )}
        
        {agent.xml && (
          <div>
            <Collapse
              size="small"
              ghost
              activeKey={agentXmlExpanded}
              onChange={(keys) => setAgentXmlExpanded(keys as string[])}
              items={[
                {
                  key: agentXmlKey,
                  label: <Text strong>agent xml</Text>,
                  children: (
                    <div style={{ borderRadius: '4px', overflow: 'hidden' }}>
                      <LazySyntaxHighlighter
                        language="xml"
                        shouldRender={agentXmlExpanded.includes(agentXmlKey)}
                      >
                        {agent.xml}
                      </LazySyntaxHighlighter>
                    </div>
                  )
                }
              ]}
            />
          </div>
        )}
      </Space>
    </Card>
  )
})

WorkflowAgentCard.displayName = 'WorkflowAgentCard'

