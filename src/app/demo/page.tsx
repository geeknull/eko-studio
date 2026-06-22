'use client';

import { useSyncExternalStore } from 'react';
import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation';
import { DemoMessageRenderer } from '@/components/demo/DemoMessageRenderer';
import { SAMPLE_MESSAGES } from '@/components/demo/sample-messages';
import { SYNTHETIC_SAMPLES } from '@/components/demo/synthetic-samples';

// Real recorded samples (from agent-log) + synthetic file/error samples so the
// demo exercises every DemoMessageRenderer branch.
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
        AI Elements PoC — message rendering
      </h1>
      {hydrated && (
        <Conversation className="rounded-md border">
          <ConversationContent>
            {ALL_SAMPLES.map((message, i) => (
              <DemoMessageRenderer key={i} content={message} />
            ))}
          </ConversationContent>
        </Conversation>
      )}
    </>
  );
}
