'use client';

import { useCallback, useMemo } from 'react';
import { useCopilotChat, useCoAgent } from '@copilotkit/react-core';
import {
  Role,
  TextMessage,
  type Message,
} from '@copilotkit/runtime-client-gql';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** True while the assistant is still streaming this message */
  isStreaming?: boolean;
}

/** Shape of agent-level shared state – extend to match your LangGraph state */
export interface AgentState {
  [key: string]: unknown;
}

export interface UseAgentChatOptions {
  /**
   * The agent name registered in CopilotRuntime.
   * Omit for a Direct-to-LLM (BasicAgent) setup.
   */
  agentName?: string;
  initialAgentState?: AgentState;
}

export interface UseAgentChatReturn {
  /** Normalized messages ready to render */
  messages: ChatMessage[];
  /** True while a response is in-flight */
  isLoading: boolean;
  /** Send a user message */
  sendMessage: (text: string) => void;
  /** Bidirectional shared state with the agent */
  agentState: AgentState;
  setAgentState: (state: Partial<AgentState>) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAgentChatCoPilot({
  agentName,
  initialAgentState = {},
}: UseAgentChatOptions = {}): UseAgentChatReturn {
  // useCopilotChat gives us the raw message list + send capability
  const { visibleMessages, appendMessage, isLoading } = useCopilotChat();

  // useCoAgent syncs bidirectional state with a named LangGraph/CrewAI agent.
  // Safe to call even without an agentName – it becomes a no-op in that case.
  const { state: agentState, setState: setAgentState } = useCoAgent<AgentState>(
    agentName
      ? { name: agentName, initialState: initialAgentState }
      : { name: '__noop__', initialState: initialAgentState },
  );

  // Normalize CopilotKit's internal Message type → our simple ChatMessage
  const messages: ChatMessage[] = useMemo(() => {
    return (visibleMessages ?? [])
      .filter((m: Message) => m instanceof TextMessage)
      .map((m: Message) => {
        const tm = m as TextMessage;
        return {
          id: tm.id,
          role: tm.role === Role.User ? 'user' : 'assistant',
          content: tm.content,
          isStreaming: false, // CopilotKit resolves streaming internally
        };
      });
  }, [visibleMessages]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      appendMessage(new TextMessage({ role: Role.User, content: text.trim() }));
    },
    [appendMessage],
  );

  return {
    messages,
    isLoading,
    sendMessage,
    agentState: agentState ?? initialAgentState,
    setAgentState,
  };
}
