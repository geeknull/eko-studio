'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { SseEventData, AgentMessageEvent, TextMessageEvent, ConnectedEvent, CompleteEvent, StreamCallbackMessage } from '../types';
import { useChatStore } from '@/store/chatStore';

interface UseSSEOptions {
  url: string
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

// Type guard: Check if it's an Agent message event
const isAgentMessage = (d: SseEventData): d is AgentMessageEvent => {
  return 'time' in d && 'timestamp' in d && 'content' in d && !('type' in d);
};

export const useSSE = ({
  url,
  onConnect,
  onDisconnect,
  onError,
}: UseSSEOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messageCountRef = useRef(0);

  // Get action from store
  const { addAssistantMessage } = useChatStore();

  // Use ref to keep the latest reference of callback functions, preventing unnecessary re-execution of useEffect due to callback updates
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);

  // Update ref on every render
  useEffect(() => {
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
  });

  const cleanup = useCallback((reason?: string) => {
    if (eventSourceRef.current) {
      console.log(`[SSE] Closing connection. Reason: ${reason || 'Unknown'}. Total messages received: ${messageCountRef.current}`);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      messageCountRef.current = 0;
      if (onDisconnectRef.current) onDisconnectRef.current();
    }
  }, []); // onDisconnect is no longer in dependencies

  const connect = useCallback((overrideUrl?: string) => {
    const targetUrl = overrideUrl || url;

    if (!targetUrl) {
      console.warn('[SSE] No URL provided');
      return;
    }

    // If already connected to the same URL and readyState is not CLOSED, do nothing
    if (eventSourceRef.current && eventSourceRef.current.url === targetUrl && eventSourceRef.current.readyState !== EventSource.CLOSED) {
      console.warn('[SSE] Already connected to this URL');
      return;
    }

    // If already connected but URL is different, disconnect first
    if (eventSourceRef.current) {
      cleanup('Switching URL');
    }

    console.log(`[SSE] Connecting to ${targetUrl}...`);
    const eventSource = new EventSource(targetUrl);
    eventSourceRef.current = eventSource;
    messageCountRef.current = 0;

    eventSource.onopen = () => {
      console.log('[SSE] Connection established');
      setIsConnected(true);
      if (onConnectRef.current) onConnectRef.current();
    };

    eventSource.onerror = async (error) => {
      console.error('[SSE] Connection error:', error);

      // If connection failed immediately, try to get error details via fetch
      if (eventSource.readyState === EventSource.CLOSED) {
        try {
          const response = await fetch(targetUrl);
          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorDetail = `HTTP ${response.status}`;

            if (contentType?.includes('text/event-stream')) {
              const text = await response.text();
              const dataMatch = text.match(/data:\s*(.+)/);
              if (dataMatch) {
                try {
                  const errorData = JSON.parse(dataMatch[1]);
                  errorDetail = errorData.message || errorData.error || errorDetail;
                } catch {
                  errorDetail = dataMatch[1];
                }
              }
            }

            console.error(`[SSE] Server error details: ${errorDetail}`);

            // Show notification
            import('antd').then(({ notification }) => {
              notification.error({
                message: 'SSE Connection Error',
                description: errorDetail,
                duration: 0,
              });
            });
          }
        } catch (fetchError) {
          console.error('[SSE] Failed to fetch error details:', fetchError);
        }
      }

      if (onErrorRef.current) onErrorRef.current(error);
    };

    // Listen for server-sent error events (contains detailed error info)
    eventSource.addEventListener('error', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.error('[SSE] Server error event:', data);
        // Show error via notification
        if (data.error || data.message) {
          const errorMessage = data.message || data.error;
          import('antd').then(({ notification }) => {
            notification.error({
              message: 'Server Error',
              description: errorMessage,
              duration: 0,
            });
          });
        }
      } catch (e) {
        // Not a JSON message, ignore
      }
    });

    eventSource.onmessage = (event) => {
      try {
        // Parse the data if it's JSON, otherwise use as string
        let data: SseEventData;
        try {
          data = JSON.parse(event.data);
        }
        catch (e) {
          // Handle plain text data format
          // Check if it matches our expected format even if not valid JSON initially
          console.log('[SSE] Received raw data:', event.data);
          return;
        }

        if (isAgentMessage(data)) {
          addAssistantMessage(data.content);
        }
      }
      catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _unused = error; // suppress unused warning if needed, but we log it
        console.error('[SSE] Error parsing message:', error);
      }
    };
  }, [url, cleanup, addAssistantMessage]);

  const disconnect = useCallback(() => {
    cleanup('Manual Disconnect');
  }, [cleanup]);

  // Auto cleanup on unmount
  useEffect(() => {
    return () => {
      // In development (Fast Refresh or React.StrictMode), components might be re-mounted.
      // Standard practice is to disconnect in useEffect cleanup.
      cleanup('Unmount');
    };
  }, [cleanup]);

  return {
    isConnected,
    connect,
    disconnect,
  };
};
