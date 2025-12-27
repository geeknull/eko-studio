import type {
  StreamCallbackMessage,
  Workflow,
  WorkflowAgent,
  WorkflowNode,
} from '@eko-ai/eko';

export type { StreamCallbackMessage, Workflow, WorkflowAgent, WorkflowNode };

// Below are types that are not exported from @eko-ai/eko but are used in the project.
// We define them locally to match the expected structure.

export type WorkflowTextNode = {
  type: 'normal'
  text: string
  input?: string | null
  output?: string | null
};

export type WorkflowForEachNode = {
  type: 'forEach'
  items: string // list or variable name
  nodes: WorkflowNode[]
};

export type WorkflowWatchNode = {
  type: 'watch'
  event: 'dom' | 'gui' | 'file'
  loop: boolean
  description: string
  triggerNodes: (WorkflowTextNode | WorkflowForEachNode)[]
};
