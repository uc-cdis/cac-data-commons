"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import type {
  ChatInterrupt,
  ChatMessage,
  InterruptDecision,
  ResolvedInterrupt,
  Timings,
} from "./types";
import { toChatMessage, lastUserIndex } from "./utils";
import { useChatTimings } from "./useChatTimings";
import { useChatInterrupts } from "./useChatInterrupts";
import { useChatPersistence } from "./useChatPersistence";
import { useChatList } from "./useChatList";
import type { ChatRecord } from "./db";
import { reportError, subscribeToChatErrors, type ChatError } from "./errors"

export interface UseChatApi {
  messages: ChatMessage[];
  isRunning: boolean;
  sendMessage: (text: string) => void;
  stopRun: () => void;
  clearMessages: () => void;
  error: ChatError | null;
  clearError: () => void;
  /** True once the user stops a run, until the next run or chat switch. */
  stopped: boolean;
  timings: Timings;
  /** Approvals the agent is parked on. Every run is blocked until answered. */
  interrupts: ChatInterrupt[];
  /** Separate from isRunning - nothing streams, but sending is still refused. */
  awaitingApproval: boolean;
  /** Already decided, kept so the transcript still shows them. */
  resolvedInterrupts: ResolvedInterrupt[];
  /** Answered but not yet sent, while the rest of the set is still open. */
  answeredInterruptIds: string[];
  /** A decision is on the wire. */
  interruptSubmitting: boolean;
  /** Record a decision. The resume fires once every open approval has one. */
  answerInterrupt: (id: string, decision: InterruptDecision) => void;
  /** The prompt Retry and Edit act on, or null when neither is allowed. */
  editableMessageId: string | null;
  retry: () => void;
  editAndRerun: (text: string) => void;
  chatId: string;
  chats: ChatRecord[];
  chatsLoading: boolean;
  selectChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  deleteAllChats: () => Promise<void>;
}

// The single headless facade for the chat surface. /ui consumes this hook and
// the ChatMessage type, nothing else.
export function useChat({agentId = "default"}:{agentId?: string}): UseChatApi {
  const { agent } = useAgent({ agentId });
  const { copilotkit } = useCopilotKit();

  const [error, setError] = useState<ChatError | null>(null);
  const [stopped, setStopped] = useState(false);

  // Every reportError lands here. Registered ahead of the hooks below so it can't
  // miss what they report on mount.
  useEffect(() => subscribeToChatErrors(setError), []);

  const clearError = useCallback(() => setError(null), []);

  const { timings, startTurn, reset: resetTimings } = useChatTimings(agent);
  // Must stay above useChatPersistence. Effects run in call order, so this hook
  // subscribes first and graduates the just-decided approval before persistence
  // writes the row from that same event. Swap them and every plan saves a turn late.
  const {
    interrupts,
    resolved: resolvedInterrupts,
    answeredIds: answeredInterruptIds,
    submitting: interruptSubmitting,
    answer: answerInterrupt,
    getResolved: getResolvedInterrupts,
    adopt: adoptInterrupts,
    clear: clearInterrupts,
  } = useChatInterrupts(agent, copilotkit);
  const { chats, loading: chatsLoading, refresh, rename, remove, clear } = useChatList();
  const { chatId, onUserMessage, newChat, openChat } =
    useChatPersistence(agent, refresh, getResolvedInterrupts);

  const awaitingApproval = interrupts.length > 0;

  // Skipped when an approval is already open - a remount with one pending.
  // connectAgent detaches the active run and runs the same pre-flight check, so
  // with no resume array it kills the resume and throws. Read the agent field, not
  // awaitingApproval: with the flag in the deps this re-fires the instant a resume
  // clears the card, which is the worst moment to connect.
  useEffect(() => {
    if (agent.pendingInterrupts.length > 0) return;
    void copilotkit.connectAgent({ agent }).catch((err) => {
      reportError("connect", err);
    });
  }, [agent, copilotkit]);


  useEffect(() => {
    const sub = agent.subscribe({
      onRunFailed({ error }) {
        reportError("run", error);
      },
      onRunErrorEvent({ event }) {
        if (event.code === "abort") return; // the user pressed Stop
        reportError("run", event);
      },
      // A landed abort ends on RUN_ERROR/abort, never here, so reaching this means
      // the stop didn't take and the answer is real - unless the run only paused
      // to ask something, which isn't an answer.
      onRunFinishedEvent(params) {
        if (params.outcome === "interrupt") return;
        setStopped(false);
      },
    });
    return () => sub.unsubscribe();
  }, [agent]);


  // CopilotKit-level failures - tool execution, transport - that never become agent
  // events. Subscribing directly because the v2 <CopilotKit> wrapper destructures
  // onError away and never forwards it to the provider.
  useEffect(() => {
    const sub = copilotkit.subscribe({
      onError({ error }) {
        reportError("run", error);
      },
    });
    return () => sub.unsubscribe();
  }, [copilotkit]);


  // Translate the agent's buffer into our own shape, so /ui never sees an AG-UI
  // or CopilotKit type.
  const messages = useMemo<ChatMessage[]>(
    () => agent.messages.flatMap(toChatMessage),
    [agent.messages],
  );

  // Run whatever is in the buffer.
  const runCurrent = useCallback(() => {
    if (agent.pendingInterrupts.length > 0) return;
    void copilotkit.runAgent({ agent }).catch((err) => reportError("run", err));
  }, [agent, copilotkit]);


  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || agent.isRunning || agent.pendingInterrupts.length > 0 || awaitingApproval)
        return;

      const id = crypto.randomUUID();

      setError(null);
      setStopped(false);

      // Order matters: the clock starts before the message exists, and the prompt
      // is persisted before the run so a crash can't lose it.
      startTurn(id);
      agent.addMessage({ id, role: "user", content: trimmed });
      onUserMessage();
      runCurrent();
    },
    [agent, onUserMessage, runCurrent, startTurn, awaitingApproval],
  );

  // Skips reportError on purpose: stopping is the user's doing, not a failure.
  // stopAgent still throws locally on occasion; warn rather than surface it.
  const stopRun = useCallback(() => {
    if (!agent.isRunning) return;
    setStopped(true);
    try {
      void Promise.resolve(copilotkit.stopAgent({ agent })).catch((err) =>
        console.warn("[chat-core] stopAgent rejected", err),
      );
    } catch (err) {
      console.warn("[chat-core] stopAgent threw", err);
    }
  }, [agent, copilotkit]);


  const last = agent.messages[agent.messages.length - 1];
  // An open approval leaves isRunning false, so without that guard Retry and Edit both
  // light up next to the card and blow up on the pre-flight check.
  const editableMessageId =
    !agent.isRunning && !awaitingApproval && last?.role === "user" ? last.id : null;

  const retry = useCallback(() => {
    if (agent.isRunning || awaitingApproval) return;
    const idx = lastUserIndex(agent.messages);
    if (idx < 0) return;
    setError(null);
    setStopped(false);
    startTurn(agent.messages[idx].id);
    runCurrent();
  }, [agent, runCurrent, startTurn, awaitingApproval]);


  const editAndRerun = useCallback(
    (text: string) => {
      // Check before setMessages: it truncates the buffer, so a blocked edit would
      // destroy the transcript on its way to failing.
      if (
        agent.isRunning ||
        agent.pendingInterrupts.length > 0 ||
        awaitingApproval ||
        !text.trim()
      )
        return;
      const idx = lastUserIndex(agent.messages);
      if (idx < 0) return;
      agent.setMessages(agent.messages.slice(0, idx));
      sendMessage(text);
    },
    [agent, sendMessage, awaitingApproval],
  );

  // Shared by New Chat and by loading an old one.
  const resetLocalState = useCallback(() => {
    setError(null);
    setStopped(false);
    resetTimings();
    // One agent serves every chat in the sidebar, and its pending interrupts
    // outlive setMessages and a threadId swap. Dropping them here is what makes
    // New Chat the way out of an approval you don't want to answer.
    clearInterrupts();
  }, [resetTimings, clearInterrupts]);


  const clearMessages = useCallback(() => {
    newChat();
    resetLocalState();
  }, [newChat, resetLocalState]);


  const selectChat = useCallback(
    async (id: string) => {
      const restored = await openChat(id);
      if (!restored) return;
      // resetLocalState wipes the interrupt history, so seed the stored one after
      // it, never before.
      resetLocalState();
      adoptInterrupts(restored);
    },
    [openChat, resetLocalState, adoptInterrupts],
  );

  const deleteChat = useCallback(
    async (id: string) => {
      // Can't delete the chat that's mid-run.
      if (id === chatId && agent.isRunning) return;
      await remove(id);
      if (id === chatId) clearMessages();
    },
    [agent, remove, chatId, clearMessages],
  );

  const deleteAllChats = useCallback(async () => {
    if (agent.isRunning) return;
    await clear();
    clearMessages();
  }, [agent, clear, clearMessages]);

  return {
    messages,
    isRunning: agent.isRunning,
    sendMessage,
    stopRun,
    clearMessages,
    error,
    clearError,
    stopped,
    timings,
    interrupts,
    awaitingApproval,
    resolvedInterrupts,
    answeredInterruptIds,
    interruptSubmitting,
    answerInterrupt,
    editableMessageId,
    retry,
    editAndRerun,
    chatId,
    chats,
    chatsLoading,
    selectChat,
    renameChat: rename,
    deleteChat,
    deleteAllChats,
  };
}
