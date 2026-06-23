import type { StreamCallbackMessage } from '@/types';

/**
 * Synthetic samples for message types absent from the recorded logs — the logged
 * agent run produced no `file` or `error` messages, so these are hand-built to
 * exercise the AgentMessageRenderer `file` and `error` branches. Field shapes
 * mirror the existing FileRenderer / ErrorRenderer.
 */
export const SYNTHETIC_SAMPLES: StreamCallbackMessage[] = [
  {
    streamType: 'agent',
    agentName: 'Browser',
    type: 'file',
    mimeType: 'text/plain',
    // base64 of "Hello from eko Studio — AI Elements demo"
    data: 'SGVsbG8gZnJvbSBla28gU3R1ZGlvIOKAlCBBSSBFbGVtZW50cyBkZW1v',
  },
  {
    streamType: 'agent',
    agentName: 'Browser',
    type: 'error',
    error: 'Synthetic error: navigation timeout of 30000ms exceeded',
  },
] as unknown as StreamCallbackMessage[];
