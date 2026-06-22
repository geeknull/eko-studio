'use client';

import React from 'react';
import { toast } from 'sonner';
import { Bot } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useChatStore, ChatMessage } from '@/store/chatStore';
import { useConfigStore } from '@/store';
import { useSSE } from '@/hooks/useSSE';
import { logger } from '@/utils/logger';
import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { AgentMessageRenderer } from '@/components/messageRenderer/AgentMessageRenderer';

interface AgentChatProps {
  onViewJson: (message: ChatMessage) => void
  onConfigRequired?: () => void
}

export const AgentChat: React.FC<AgentChatProps> = ({
  onViewJson,
  onConfigRequired,
}) => {
  const { mode, normalConfig, replayConfig } = useConfigStore();
  const {
    messages,
    isLoading,
    addUserMessage,
    addAssistantMessage,
    setLoading,
  } = useChatStore();

  // Use SSE Hook
  const { isConnected, connect, disconnect } = useSSE({
    url: '', // Dynamic connection, initially empty
    onDisconnect: () => {
      setLoading(false);
    },
    onError: (error) => {
      setLoading(false);
      logger.error('SSE Error:', error);
      toast.error('Connection interrupted, please retry');
    },
  });

  const handleSend = async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage) return;

    // Check if normal mode requires config
    if (mode === 'normal' && !normalConfig) {
      toast.warning('Please configure Normal mode parameters first');
      onConfigRequired?.();
      return;
    }

    // Add user message
    addUserMessage(userMessage);

    // Set loading state
    setLoading(true);

    try {
      // 1. Call API to start Agent
      const requestBody: Record<string, unknown> = { query: userMessage };

      // Add normal config if in normal mode
      if (mode === 'normal' && normalConfig) {
        requestBody.normalConfig = normalConfig;
      }

      const response = await fetch('/api/agent/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data && data.data.taskId) {
        const taskId = data.data.taskId;

        // 2. Use returned taskId to establish SSE connection
        // If already connected, disconnect first
        if (isConnected) {
          disconnect();
        }

        // Build SSE URL with mode and replay parameters
        let sseUrl = `/api/agent/stream/${taskId}?mode=${mode}`;

        if (mode === 'replay') {
          sseUrl += `&playbackMode=${replayConfig.playbackMode}`;
          if (replayConfig.playbackMode === 'realtime') {
            sseUrl += `&speed=${replayConfig.speed}`;
          }
          else {
            sseUrl += `&fixedInterval=${replayConfig.fixedInterval}`;
          }
        }

        // Connect to new SSE stream
        connect(sseUrl);
      }
      else {
        throw new Error('Invalid response format: missing taskId');
      }
    }
    catch (error) {
      logger.error('Failed to start agent:', error);
      setLoading(false);
      addAssistantMessage(
        `Error: Failed to start agent. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  // Crash guard: rendering a long / high-volume run's full history (thousands of
  // heavy AI Elements components) can exhaust memory and freeze the page. Render
  // only the most recent window; older messages stay in the store.
  const MAX_RENDERED_MESSAGES = 100;
  const hiddenCount = Math.max(0, messages.length - MAX_RENDERED_MESSAGES);
  const visibleMessages
    = hiddenCount > 0 ? messages.slice(-MAX_RENDERED_MESSAGES) : messages;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
      {messages.length === 0
        ? (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4">
            No messages yet, start chatting!
          </div>
        )
        : (
          <Conversation className="flex-1 min-h-0">
            <ConversationContent>
              {hiddenCount > 0 && (
                <div className="text-center text-xs text-muted-foreground">
                  {`${hiddenCount} earlier message(s) hidden for performance`}
                </div>
              )}
              {visibleMessages.map(m => (
                typeof m.content === 'string'
                  ? (
                    <Message from={m.role === 'user' ? 'user' : 'assistant'} key={m.id}>
                      <MessageContent>{m.content}</MessageContent>
                    </Message>
                  )
                  : (
                    <AgentMessageRenderer
                      content={m.content}
                      key={m.id}
                      onViewJson={() => onViewJson(m)}
                    />
                  )
              ))}
            </ConversationContent>
          </Conversation>
        )}
      {isLoading && (
        <div className="flex justify-start gap-3 border-t p-4">
          <Bot className="size-6 text-muted-foreground" />
          <Spinner className="size-5" />
        </div>
      )}
      <div className="flex-shrink-0 border-t p-4">
        <PromptInput
          onSubmit={(message) => {
            if (message.text?.trim()) {
              handleSend(message.text);
            }
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea
              disabled={isLoading}
              placeholder="Type a message..."
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              onStop={() => setLoading(false)}
              status={isLoading ? 'streaming' : undefined}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
