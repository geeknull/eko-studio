import React from 'react'
import { WorkflowAgentCard } from '../../common/WorkflowAgentCard'
import type { StreamCallbackMessage, WorkflowAgent } from '../../../types'

interface AgentStartRendererProps {
  content: StreamCallbackMessage & { type: 'agent_start'; agentNode: WorkflowAgent }
}

/**
 * agent_start message renderer
 */
export const AgentStartRenderer: React.FC<AgentStartRendererProps> = React.memo(({ 
  content 
}) => {
  const { agentNode, nodeId } = content

  return (
    <div>
      {nodeId && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#999', fontSize: '12px' }}>nodeId: </span>
          <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{nodeId}</span>
        </div>
      )}
      <WorkflowAgentCard agent={agentNode} />
    </div>
  )
})

AgentStartRenderer.displayName = 'AgentStartRenderer'

