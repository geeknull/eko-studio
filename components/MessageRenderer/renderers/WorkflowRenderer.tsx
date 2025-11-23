import React from 'react'
import { Tag, Typography, Space, Collapse } from 'antd'
import { LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { ThoughtChain } from '@ant-design/x'
import type { ThoughtChainProps, ThoughtChainItem } from '@ant-design/x'
import { LazySyntaxHighlighter } from '../../base/LazySyntaxHighlighter'
import { WorkflowAgentCard } from '../../common/WorkflowAgentCard'
import type { StreamCallbackMessage, WorkflowAgent } from '../../../types'

const { Text, Paragraph } = Typography

interface WorkflowRendererProps {
  content: StreamCallbackMessage & { type: 'workflow' }
}

export const WorkflowRenderer: React.FC<WorkflowRendererProps> = React.memo(({
  content
}) => {
  const { workflow, streamDone } = content
  const [xmlActiveKeys, setXmlActiveKeys] = React.useState<string[]>(['xml'])
  const [thoughtExpandedKeys, setThoughtExpandedKeys] = React.useState<string[]>(['thought'])

  // Create agents Map for quick lookup
  const agentsMap = React.useMemo(() => {
    const map = new Map<string, WorkflowAgent>()
    workflow.agents?.forEach(agent => {
      map.set(agent.id, agent)
    })
    return map
  }, [workflow.agents])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Text strong style={{ fontSize: '14px' }}>workflow: {workflow.name || ''}</Text>
        {streamDone !== undefined && (
          <Tag color={streamDone ? 'success' : 'processing'}>
            {streamDone ? 'completed' : 'processing...'}
          </Tag>
        )}
      </div>
      <Space orientation="vertical" size="small" style={{ width: '100%', marginTop: '8px' }}>
        {workflow.thought && (
          <ThoughtChain
            collapsible={{
              expandedKeys: thoughtExpandedKeys,
              onExpand: (keys) => setThoughtExpandedKeys(keys)
            }}
            items={[
              {
                key: 'thought',
                title: 'thought',
                icon: streamDone ? <CheckCircleOutlined /> : <LoadingOutlined />,
                content: (
                  <Paragraph style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                    {workflow.thought}
                  </Paragraph>
                ),
                status: streamDone ? 'success' : 'pending'
              }
            ]}
          />
        )}
        
        {workflow.xml && (
          <div>
            <Collapse 
              size="small" 
              ghost 
              activeKey={xmlActiveKeys}
              onChange={(keys) => setXmlActiveKeys(keys as string[])}
              items={[
                {
                  key: 'xml',
                  label: <Text strong>workflow xml</Text>,
                  children: (
                    <div style={{ borderRadius: '4px', overflow: 'hidden' }}>
                      <LazySyntaxHighlighter 
                        language="xml" 
                        shouldRender={xmlActiveKeys.includes('xml')}
                      >
                        {workflow.xml}
                      </LazySyntaxHighlighter>
                    </div>
                  )
                }
              ]}
            />
          </div>
        )}
        
        {workflow.agents && workflow.agents.length > 0 && (
          <div>
            <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              agents ({workflow.agents.length})
            </Text>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              {workflow.agents.map((agent: WorkflowAgent) => (
                <WorkflowAgentCard 
                  key={agent.id}
                  agent={agent}
                  agentsMap={agentsMap}
                />
              ))}
            </Space>
          </div>
        )}
      </Space>
    </div>
  )
})

WorkflowRenderer.displayName = 'WorkflowRenderer'

