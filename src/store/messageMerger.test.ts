import { describe, it, expect } from 'vitest';
import {
  shouldMergeByAgentNameAndType,
  mergeMessagesByAgentNameAndType,
  shouldMergeByWorkflowTaskId,
  mergeMessagesByWorkflowTaskId,
  isSameMessage,
} from './messageMerger';
import type { ChatMessage } from './chatStore';

// The real StreamCallbackMessage is a large discriminated union; for these
// pure-logic tests we build minimally-shaped fixtures and cast.
type Content = Extract<ChatMessage['content'], object>;
const content = (o: Record<string, unknown>): Content => o as unknown as Content;
const assistant = (c: ChatMessage['content']): ChatMessage => ({ id: '1', role: 'assistant', content: c });

describe('shouldMergeByAgentNameAndType', () => {
  it('returns false when there is no previous message', () => {
    expect(shouldMergeByAgentNameAndType(undefined, content({ agentName: 'a', type: 'text' }))).toBe(false);
  });

  it('returns false when the previous message is not from the assistant', () => {
    const prev: ChatMessage = { id: '1', role: 'user', content: content({ agentName: 'a', type: 'text' }) };
    expect(shouldMergeByAgentNameAndType(prev, content({ agentName: 'a', type: 'text' }))).toBe(false);
  });

  it('returns false when either side is a plain string', () => {
    expect(shouldMergeByAgentNameAndType(assistant('hi'), content({ agentName: 'a', type: 'text' }))).toBe(false);
    expect(shouldMergeByAgentNameAndType(assistant(content({ agentName: 'a', type: 'text' })), 'hi')).toBe(false);
  });

  it('merges when agentName and type match', () => {
    const prev = assistant(content({ agentName: 'Browser', type: 'text' }));
    expect(shouldMergeByAgentNameAndType(prev, content({ agentName: 'Browser', type: 'text' }))).toBe(true);
  });

  it('does not merge when agentName or type differ', () => {
    const prev = assistant(content({ agentName: 'a', type: 'text' }));
    expect(shouldMergeByAgentNameAndType(prev, content({ agentName: 'b', type: 'text' }))).toBe(false);
    expect(shouldMergeByAgentNameAndType(prev, content({ agentName: 'a', type: 'thinking' }))).toBe(false);
  });

  it('normalizes Planer/planer -> workflow before comparing', () => {
    const prev = assistant(content({ agentName: 'x', type: 'Planer' }));
    expect(shouldMergeByAgentNameAndType(prev, content({ agentName: 'x', type: 'workflow' }))).toBe(true);
    expect(shouldMergeByAgentNameAndType(prev, content({ agentName: 'x', type: 'planer' }))).toBe(true);
  });

  it('normalizes Browser/browser -> tool_use before comparing', () => {
    const prev = assistant(content({ agentName: 'x', type: 'Browser' }));
    expect(shouldMergeByAgentNameAndType(prev, content({ agentName: 'x', type: 'tool_use' }))).toBe(true);
  });
});

describe('mergeMessagesByAgentNameAndType', () => {
  it('overwrites content with the new one and increments repeat', () => {
    const prev = assistant(content({ agentName: 'a', type: 'text', text: 'old' }));
    const next = content({ agentName: 'a', type: 'text', text: 'new' });
    const merged = mergeMessagesByAgentNameAndType(prev, next as Content);
    expect(merged.content).toBe(next);
    expect(merged.repeat).toBe(2);
  });

  it('keeps counting repeat from an existing value', () => {
    const prev: ChatMessage = { id: '1', role: 'assistant', content: content({ agentName: 'a', type: 'text' }), repeat: 3 };
    const merged = mergeMessagesByAgentNameAndType(prev, content({ agentName: 'a', type: 'text' }));
    expect(merged.repeat).toBe(4);
  });
});

describe('shouldMergeByWorkflowTaskId', () => {
  it('returns false when the new message has no workflow.taskId', () => {
    const prev = assistant(content({ type: 'workflow', workflow: { taskId: 't1' } }));
    expect(shouldMergeByWorkflowTaskId(prev, content({ type: 'workflow' }))).toBe(false);
  });

  it('returns false when taskIds differ', () => {
    const prev = assistant(content({ type: 'workflow', workflow: { taskId: 't1' } }));
    expect(shouldMergeByWorkflowTaskId(prev, content({ type: 'workflow', workflow: { taskId: 't2' } }))).toBe(false);
  });

  it('returns true when both share the same workflow.taskId', () => {
    const prev = assistant(content({ type: 'workflow', workflow: { taskId: 't1' } }));
    expect(shouldMergeByWorkflowTaskId(prev, content({ type: 'workflow', workflow: { taskId: 't1' } }))).toBe(true);
  });
});

describe('mergeMessagesByWorkflowTaskId', () => {
  it('merges workflow objects and lets the new xml win', () => {
    const prev = assistant(content({ type: 'workflow', workflow: { taskId: 't1', xml: '<old/>', name: 'wf' } }));
    const next = content({ type: 'workflow', workflow: { taskId: 't1', xml: '<new/>' } });
    const merged = mergeMessagesByWorkflowTaskId(prev, next as Content);
    const wf = (merged.content as unknown as Record<string, { taskId: string, xml: string, name?: string }>).workflow;
    expect(wf.xml).toBe('<new/>');
    expect(wf.name).toBe('wf'); // preserved from the previous message
    expect(merged.repeat).toBe(2);
  });

  it('falls back to the previous xml when the new message omits it', () => {
    const prev = assistant(content({ type: 'workflow', workflow: { taskId: 't1', xml: '<old/>' } }));
    const next = content({ type: 'workflow', workflow: { taskId: 't1' } });
    const merged = mergeMessagesByWorkflowTaskId(prev, next as Content);
    const wf = (merged.content as unknown as Record<string, { xml: string }>).workflow;
    expect(wf.xml).toBe('<old/>');
  });
});

describe('isSameMessage', () => {
  it('compares identical strings', () => {
    expect(isSameMessage(assistant('hello'), 'hello')).toBe(true);
    expect(isSameMessage(assistant('hello'), 'world')).toBe(false);
  });

  it('deep-compares object content', () => {
    expect(isSameMessage(assistant(content({ type: 'text', text: 'a' })), content({ type: 'text', text: 'a' }))).toBe(true);
    expect(isSameMessage(assistant(content({ type: 'text', text: 'a' })), content({ type: 'text', text: 'b' }))).toBe(false);
  });

  it('returns false when one side is a string and the other an object', () => {
    expect(isSameMessage(assistant('a'), content({ type: 'text' }))).toBe(false);
  });

  it('returns false without an assistant previous message', () => {
    expect(isSameMessage(undefined, 'a')).toBe(false);
    expect(isSameMessage({ id: '1', role: 'user', content: 'a' }, 'a')).toBe(false);
  });
});
