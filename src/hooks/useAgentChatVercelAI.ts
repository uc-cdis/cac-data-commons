'use client';

/**
 * useM3Chat.ts — AI SDK 5.0 (@ai-sdk/react@3.x) + Mantine
 *
 * @ai-sdk/react is at v3.x but implements AI SDK 5.0.
 * Key v5 API facts:
 *   - api + body live inside transport: new DefaultChatTransport({ api, body })
 *   - isLoading is gone → use status: 'ready' | 'submitted' | 'streaming'
 *   - append / handleSubmit gone → use sendMessage({ text })
 *   - input management is your own responsibility
 *   - message.content is a plain string; message.parts is the typed array
 *   - initialMessages option expects UIMessage[] → seed via setMessages effect
 *
 * Install: npm install ai @ai-sdk/react
 */

import { useChat, type UIMessage } from '@ai-sdk/react';
import { useCallback, useEffect, useRef } from 'react';
import { DefaultChatTransport } from 'ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface UseVercelAIChatOptions {
  /**
   * Defaults to the M3 AI Commons endpoint.
   * Use "/api/chat" for the local dev proxy to avoid CORS in dev.
   */
  apiUrl?: string;
  /** Seed messages pre-populated before the first user turn */
  initialMessages?: ChatMessage[];
  /** Extra fields merged into the POST body on every request */
  body?: Record<string, unknown>;
  onError?: (error: Error) => void;
}

export interface UseVercelAIChatReturn {
  messages: ChatMessage[];
  /** True while waiting for or receiving a response */
  isLoading: boolean;
  /** Raw v5 status: 'ready' | 'submitted' | 'streaming' | 'error' */
  status: string;
  /** Partial text of the in-flight assistant message */
  streamingContent: string;
  sendMessage: (text: string) => void;
  reset: () => void;
  stop: () => void;
  error: Error | undefined;
}

// ---------------------------------------------------------------------------
// Helper: plain ChatMessage → minimal UIMessage for seeding
// ---------------------------------------------------------------------------
function toUIMessage(m: ChatMessage): UIMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    parts: [{ type: 'text', text: m.content }],
    createdAt: new Date(),
  } as UIMessage;
}

// ---------------------------------------------------------------------------
// Helper: extract plain text from a v5 UIMessage
// ---------------------------------------------------------------------------
function extractText(message: UIMessage): string {
  if (Array.isArray(message.parts)) {
    const text = message.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join('');
    if (text) return text;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const M3_API_URL = 'https://copilot.m3aicommons.org/api/chat';

export function useAgentChatVercelAI({
  apiUrl = M3_API_URL,
  initialMessages,
  body,
  onError,
}: UseVercelAIChatOptions = {}): UseVercelAIChatReturn {
  // Keep body in a ref so the transport closure always reads the latest value
  // without needing to reconstruct DefaultChatTransport on every render.
  const bodyRef = useRef(body);
  bodyRef.current = body;

  const {
    messages,
    sendMessage: sdkSendMessage,
    setMessages,
    stop,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: apiUrl,
      // Use a function so the ref value is read fresh on each request
      body: () => ({ ...(bodyRef.current ?? {}), model: 'openai:openai/gpt-oss-120b' }) ,
       // or from a useState
    }),
    onError,
  });

  // Seed initial messages once on mount.
  // We can't pass them to useChat directly because it expects UIMessage[],
  // not our plain ChatMessage[].
  useEffect(() => {
    if (initialMessages?.length) {
      setMessages(initialMessages.map(toUIMessage));
    }
  }, []);

  const isLoading = status === 'submitted' || status === 'streaming';

  const normalizedMessages: ChatMessage[] = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: extractText(m),
    }));

  const lastMsg = messages.at(-1);
  const streamingContent =
    isLoading && lastMsg?.role === 'assistant' ? extractText(lastMsg) : '';

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;
      sdkSendMessage({ text: text.trim() });
    },
    [sdkSendMessage, isLoading],
  );

  const reset = useCallback(() => setMessages([]), [setMessages]);

  return {
    messages: normalizedMessages,
    isLoading,
    status,
    streamingContent,
    sendMessage,
    reset,
    stop,
    error,
  };
}
