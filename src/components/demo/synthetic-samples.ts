import type { StreamCallbackMessage } from '@/types';

/**
 * Synthetic samples for card types the recorded log can't showcase well — the
 * logged run produced no `file` / `error` messages, and its `workflow` / text
 * frames are empty streaming partials (no xml / no text). These hand-built ones
 * give the /demo gallery a content-rich example per type. Field shapes mirror
 * the matching AgentMessageRenderer branch.
 */
export const SYNTHETIC_SAMPLES: StreamCallbackMessage[] = [
  {
    streamType: 'workflow',
    agentName: 'Planer',
    type: 'workflow',
    streamDone: true,
    workflow: {
      name: 'Extract H1 from example.com',
      xml: `<root>
  <name>Extract H1 from example.com</name>
  <thought>Open the page and read the main heading.</thought>
  <agents>
    <agent name="Browser">
      <task>Navigate to https://example.com and return the main H1 text</task>
      <nodes>
        <node>Open https://example.com</node>
        <node>Read the H1 element's text content</node>
      </nodes>
    </agent>
  </agents>
</root>`,
    },
  },
  {
    streamType: 'agent',
    agentName: 'Browser',
    type: 'text',
    streamDone: true,
    text: 'The main H1 heading on **example.com** is `"Example Domain"`. It’s a reserved domain used for illustrative examples in documents.',
  },
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
