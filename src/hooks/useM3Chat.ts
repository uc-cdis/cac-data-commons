'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useRef } from 'react';
import { useDeepCompareEffect, useDeepCompareCallback,  } from 'use-deep-compare';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface UseM3ChatOptions {
  apiUrl?: string;
  initialMessages?: ChatMessage[];
  body?: Record<string, unknown>;
  onError?: (error: Error) => void;
}

export interface UseM3ChatReturn {
  /** Normalized plain messages (for persistence / thread titles) */
  messages: ChatMessage[];
  /** Raw UIMessage[] — preserves parts for tool calls, tables, etc. */
  rawMessages: UIMessage[];
  isLoading: boolean;
  status: string;
  streamingContent: string;
  sendMessage: (text: string) => void;
  reset: () => void;
  stop: () => void;
  error: Error | undefined;
}

const M3_API_URL = 'https://copilot.m3aicommons.org/api/chat';
const ASSISTANT_MODEL = 'openai:openai/gpt-oss-120b';
const CHAT_ROLES = new Set<ChatMessage['role']>(['user', 'assistant']);

function toUIMessage(message: ChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    parts: [{ type: 'text', text: message.content }],
    createdAt: new Date(),
  } as UIMessage;
}

function getMessageText(message: UIMessage): string {
  if (!Array.isArray(message.parts)) {
    return '';
  }

  const text = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string }).text)
    .join('');

  return text;
}

function isLoadingStatus(status: string): boolean {
  return status === 'submitted' || status === 'streaming';
}

function normalizeMessages(messages: UIMessage[]): ChatMessage[] {
  return messages
    .filter((message) => CHAT_ROLES.has(message.role as ChatMessage['role']))
    .map((message) => ({
      id: message.id,
      role: message.role as ChatMessage['role'],
      content: getMessageText(message),
    }));
}

export function useM3Chat({
                            apiUrl = M3_API_URL,
                            initialMessages,
                            body,
                            onError,
                          }: UseM3ChatOptions = {}): UseM3ChatReturn {
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
      body: () => ({
        ...(bodyRef.current ?? {}),
        model: ASSISTANT_MODEL,
      }),
    }),
    onError,
  });

  useDeepCompareEffect(() => {
    if (initialMessages?.length) {
      setMessages(initialMessages.map(toUIMessage));
    }
  }, [initialMessages, setMessages]);

  const isLoading = isLoadingStatus(status);
  const normalizedMessages = normalizeMessages(messages);

  const lastMessage = messages.at(-1);
  const streamingContent =
    isLoading && lastMessage?.role === 'assistant' ? getMessageText(lastMessage) : '';

  const sendMessage = useDeepCompareCallback(
    (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || isLoading) {
        return;
      }

      sdkSendMessage({ text: trimmedText });
    },
    [sdkSendMessage, isLoading],
  );

  const reset = useDeepCompareCallback(() => setMessages([]), [setMessages]);

  return {
    messages: normalizedMessages,
    rawMessages: messages,
    isLoading,
    status,
    streamingContent,
    sendMessage,
    reset,
    stop,
    error,
  };
}
