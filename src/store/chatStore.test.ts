import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore, type ChatMessage } from './chatStore';

type Content = Extract<ChatMessage['content'], object>;
const content = (o: Record<string, unknown>): Content => o as unknown as Content;
const store = () => useChatStore.getState();

// addAssistantMessage queues + drains asynchronously (setTimeout / rAF fallback).
const flush = () => new Promise<void>(r => setTimeout(r, 30));

describe('chatStore queue + merge dispatch', () => {
  beforeEach(() => {
    store().clearMessages();
  });

  it('addUserMessage adds a message with role "user" (not assistant)', () => {
    store().addUserMessage('hello');
    const msgs = store().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].content).toBe('hello');
  });

  it('processes a single assistant message into the list', async () => {
    store().addAssistantMessage(content({ agentName: 'a', type: 'text', text: 'hi' }));
    await flush();
    const msgs = store().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].type).toBe('eko');
    expect(msgs[0].repeat).toBe(1);
  });

  it('collapses two identical messages via the repeat count', async () => {
    store().addAssistantMessage(content({ agentName: 'a', type: 'text', text: 'same' }));
    store().addAssistantMessage(content({ agentName: 'a', type: 'text', text: 'same' }));
    await flush();
    const msgs = store().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].repeat).toBe(2);
  });

  it('merges consecutive messages with the same agentName+type, keeping the latest content', async () => {
    store().addAssistantMessage(content({ agentName: 'a', type: 'text', text: 'first' }));
    store().addAssistantMessage(content({ agentName: 'a', type: 'text', text: 'second' }));
    await flush();
    const msgs = store().messages;
    expect(msgs).toHaveLength(1);
    expect((msgs[0].content as unknown as Record<string, string>).text).toBe('second');
    expect(msgs[0].repeat).toBe(2);
  });

  it('keeps messages with different agentName/type separate', async () => {
    store().addAssistantMessage(content({ agentName: 'a', type: 'text', text: 'x' }));
    store().addAssistantMessage(content({ agentName: 'b', type: 'thinking', text: 'y' }));
    await flush();
    expect(store().messages).toHaveLength(2);
  });

  it('clearMessages resets messages and the id counter', async () => {
    store().addAssistantMessage(content({ agentName: 'a', type: 'text' }));
    await flush();
    store().clearMessages();
    expect(store().messages).toHaveLength(0);
    expect(store().nextMessageId).toBe(1);
  });
});
