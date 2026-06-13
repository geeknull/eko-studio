import type { ReactNode } from 'react';

/**
 * Minimal isolated layout for the AI Elements PoC demo page.
 * `h-screen flex flex-col` gives the AI Elements <Conversation> (which is
 * `flex-1` + StickToBottom) a height context to scroll within.
 */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col p-6">
      {children}
    </div>
  );
}
