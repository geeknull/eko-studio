export type DemoRendererKind
  = 'response' | 'reasoning' | 'tool' | 'file'
    | 'workflow' | 'agent' | 'finish' | 'error' | 'fallback';

export function resolveDemoRenderer(type: string | undefined): DemoRendererKind {
  switch (type) {
    case 'text':
    case 'normal':
      return 'response';
    case 'thinking':
      return 'reasoning';
    case 'tool_streaming':
    case 'tool_use':
    case 'tool_result':
    case 'tool_running':
      return 'tool';
    case 'file':
      return 'file';
    case 'workflow':
      return 'workflow';
    case 'agent_start':
    case 'agent_result':
      return 'agent';
    case 'finish':
      return 'finish';
    case 'error':
      return 'error';
    default:
      return 'fallback';
  }
}
