'use client';

import { useSyncExternalStore } from 'react';
import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation';
import { AgentMessageRenderer } from '@/components/messageRenderer/AgentMessageRenderer';
import { SAMPLE_MESSAGES } from '@/components/demo/sample-messages';
import { SYNTHETIC_SAMPLES } from '@/components/demo/synthetic-samples';

// Real recorded samples (from agent-log) + synthetic file/error samples so the
// gallery exercises every message-card branch. Rendered through the *real*
// AgentMessageRenderer (not a copy) so this preview matches the live chat.
const ALL_SAMPLES = [...SAMPLE_MESSAGES, ...SYNTHETIC_SAMPLES];

export default function DemoPage() {
  // Render the sample tree only after hydration. The samples are static, so SSR
  // would highlight code blocks (shiki) on the server while the client first
  // paints the unhighlighted fallback — a hydration mismatch. /demo is a
  // client-side preview (the real chat also renders messages client-side), so
  // skipping SSR of the tree here is the correct fix, not a workaround.
  // useSyncExternalStore returns the server snapshot (false) during SSR and the
  // initial hydration render, then the client snapshot (true) — no mismatch.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <>
      <h1 className="mb-4 text-lg font-semibold">
        Message card gallery — 各类型消息渲染预览
      </h1>
      {hydrated && (
        <Conversation className="rounded-md border">
          <ConversationContent>
            {ALL_SAMPLES.map((message, i) => (
              <AgentMessageRenderer key={i} content={message} />
            ))}
          </ConversationContent>
        </Conversation>
      )}
    </>
  );
}
