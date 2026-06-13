'use client';

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
  return (
    <>
      <h1 className="mb-4 text-lg font-semibold">
        AI Elements PoC — message rendering
      </h1>
      <Conversation className="rounded-md border">
        <ConversationContent>
          {ALL_SAMPLES.map((message, i) => (
            <DemoMessageRenderer key={i} content={message} />
          ))}
        </ConversationContent>
      </Conversation>
    </>
  );
}
