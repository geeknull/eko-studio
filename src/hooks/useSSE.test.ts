import { describe, it, expect } from 'vitest';
import { isAgentMessage } from './useSSE';
import type { SseEventData } from '../types';

const ev = (o: Record<string, unknown>): SseEventData => o as unknown as SseEventData;

describe('isAgentMessage', () => {
  it('accepts an agent message event (time + timestamp + content, no top-level type)', () => {
    expect(isAgentMessage(ev({ time: 't', timestamp: 1, content: {} }))).toBe(true);
  });

  it('rejects framing events that carry a top-level type (connected/completed/error)', () => {
    expect(isAgentMessage(ev({ time: 't', timestamp: 1, content: {}, type: 'connected' }))).toBe(false);
  });

  it('rejects events missing required fields', () => {
    expect(isAgentMessage(ev({ time: 't', timestamp: 1 }))).toBe(false);
    expect(isAgentMessage(ev({ content: {} }))).toBe(false);
  });
});
