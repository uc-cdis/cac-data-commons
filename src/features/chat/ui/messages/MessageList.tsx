"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollArea, Stack, Text } from "@mantine/core";
import type { ChatInterrupt, ChatMessage, ResolvedInterrupt, Timings } from "../../core";
import { MessageItem } from "./MessageItem";
import { RunStatusBanner } from "./RunStatusBanner";
import { InterruptCard } from "../interrupts";
import type { InterruptActions } from "../interrupts";
import { CHAT_MAX_WIDTH } from "../util";

export interface MessageListProps {
  messages: ChatMessage[];
  isRunning: boolean;
  timings: Timings;
  stopped: boolean;
  hasError: boolean;
  interrupts: ChatInterrupt[];
  resolvedInterrupts: ResolvedInterrupt[];
  interruptActions: InterruptActions;
  editableMessageId: string | null
  onRetry: () => void;
  onEdit: (text: string) => void;
}

const STICK_THRESHOLD_PX = 80;

export function MessageList({
  messages,
  isRunning,
  timings,
  stopped,
  hasError,
  interrupts,
  resolvedInterrupts,
  interruptActions,
  editableMessageId,
  onRetry,
  onEdit,
}: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const lastInterruptIdRef = useRef<string | null>(null);

  const handleScrollPositionChange = useCallback(({ y }: { y: number }) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    stickRef.current =
      viewport.scrollHeight - y - viewport.clientHeight < STICK_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const last = messages[messages.length - 1];
    if (last && last.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = last.id;
      if (last.role === "user") stickRef.current = true;
    }

    // A new approval halts the run, so jump to it the way we jump to a new user
    // message - otherwise a scrolled-away user just gets a dead composer.
    const openId = interrupts[0]?.id ?? null;
    if (openId !== null && openId !== lastInterruptIdRef.current) stickRef.current = true;
    lastInterruptIdRef.current = openId;

    if (stickRef.current) viewport.scrollTo({ top: viewport.scrollHeight });
  }, [messages, stopped, hasError, editableMessageId, interrupts]);


  const toolResults = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of messages) {
      if (m.role === "tool") map.set(m.toolCallId, m.content);
    }
    return map;
  }, [messages]);

  // An interrupt usually gates a tool call already on screen, so it renders inside
  // that call's stack. One that doesn't - no toolCallId, or its message hasn't
  // flushed yet - still has to appear somewhere, since an approval nobody can see
  // is a run that just stops. Decided ones too, so the record doesn't vanish.
  const { byToolCall, resolvedByToolCall, orphans, resolvedOrphans } = useMemo(() => {
    const rendered = new Set<string>();
    for (const m of messages) {
      if (m.role === "assistant") for (const tc of m.toolCalls ?? []) rendered.add(tc.id);
    }
    const homed = (id: string | null): id is string => id !== null && rendered.has(id);

    const byToolCall = new Map<string, ChatInterrupt>();
    const orphans: ChatInterrupt[] = [];
    for (const interrupt of interrupts) {
      if (homed(interrupt.toolCallId)) byToolCall.set(interrupt.toolCallId, interrupt);
      else orphans.push(interrupt);
    }

    const resolvedByToolCall = new Map<string, ResolvedInterrupt>();
    const resolvedOrphans: ResolvedInterrupt[] = [];
    for (const entry of resolvedInterrupts) {
      // Skip any that reopened - the live card wins, or the same approval shows
      // twice, once decided and once waiting.
      if (byToolCall.has(entry.interrupt.toolCallId ?? "")) continue;
      if (homed(entry.interrupt.toolCallId)) {
        resolvedByToolCall.set(entry.interrupt.toolCallId, entry);
      } else {
        resolvedOrphans.push(entry);
      }
    }

    return { byToolCall, resolvedByToolCall, orphans, resolvedOrphans };
  }, [messages, interrupts, resolvedInterrupts]);

  return (
    // No offsetScrollbars: it pads the inline end unconditionally, which shifts
    // the centered reading column off true center.
    <ScrollArea
      flex={1}
      mih={0}
      type="auto"
      viewportRef={viewportRef}
      onScrollPositionChange={handleScrollPositionChange}
    >
      <Stack gap="md" px="lg" py="md" maw={CHAT_MAX_WIDTH} mx="auto" w="100%">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            timings={timings}
            toolResults={toolResults}
            interrupts={byToolCall}
            resolvedInterrupts={resolvedByToolCall}
            interruptActions={interruptActions}
            editableMessageId={editableMessageId}
            isRunning={isRunning}
            isLast={message.id === messages[messages.length - 1]?.id}
            onEdit={onEdit}
            onRetry={onRetry}
          />
        ))}

        {resolvedOrphans.map(({ interrupt, decision }) => (
          <InterruptCard
            key={interrupt.id}
            interrupt={interrupt}
            toolCall={null}
            actions={interruptActions}
            decision={decision}
          />
        ))}

        {orphans.map((interrupt) => (
          <InterruptCard
            key={interrupt.id}
            interrupt={interrupt}
            toolCall={null}
            actions={interruptActions}
          />
        ))}

        {isRunning && <RunStatusBanner isRunning durationMs={null} />}

        {!isRunning && stopped && (
          <Text size="xs" c="dimmed">
            You stopped this response.
          </Text>
        )}
      </Stack>
    </ScrollArea>
  );
}
