"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollArea, Stack, Text } from "@mantine/core";
import type {
  ChatInterrupt,
  ChatMessage,
  ResolvedInterrupt,
  Timings,
  ToolCall,
} from "../../core";
import { MessageItem } from "./MessageItem";
import { RunStatusBanner } from "./RunStatusBanner";
import type { InterruptActions, InterruptView } from "../interrupts";
import { ToolResultCard, isTrailingTool } from "../tools";
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
  editableMessageId: string | null;
  onRetry: () => void;
  onEdit: (text: string) => void;
}

const STICK_THRESHOLD_PX = 80;

type Row =
  | { kind: "message"; key: string; message: ChatMessage }
  | { kind: "summary"; key: string; toolCall: ToolCall };

/** which tool call requires a summary card - for now run_query/rewoo*/
function summaryCardsFor(message: ChatMessage): Row[] {
  if (message.role !== "assistant") return [];
  return (message.toolCalls ?? [])
    .filter((tc) => isTrailingTool(tc.name))
    .map((tc) => ({ kind: "summary", key: `summary:${tc.id}`, toolCall: tc }));
}

/** Answers does this message close a turn. */
function endsTurn(message: ChatMessage): boolean {
  return (
    message.role === "user" ||
    (message.role === "assistant" && message.content.length > 0)
  );
}

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
  const lastPromptRef = useRef<string | null>(null);
  const lastInterruptRef = useRef<string | null>(null);

  const handleScrollPositionChange = useCallback(({ y }: { y: number }) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    stickRef.current =
      viewport.scrollHeight - y - viewport.clientHeight < STICK_THRESHOLD_PX;
  }, []);

  // Deps: anything that changes the list's height, not just the messages.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Follow the bottom again for a new prompt or a new approval
    const jumpIfNew = (id: string | null, lastSeen: { current: string | null }) => {
      if (id !== null && id !== lastSeen.current) stickRef.current = true;
      lastSeen.current = id;
    };
    const last = messages[messages.length - 1];
    jumpIfNew(last?.role === "user" ? last.id : null, lastPromptRef);
    jumpIfNew(interrupts[0]?.id ?? null, lastInterruptRef);

    if (stickRef.current) viewport.scrollTo({ top: viewport.scrollHeight });
  }, [messages, stopped, hasError, editableMessageId, interrupts]);

  const toolResults = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of messages) {
      if (m.role === "tool") map.set(m.toolCallId, m.content);
    }
    return map;
  }, [messages]);

  // Messages in the order they arrived, with each summary card parked in `waiting` until the
  // turn ends - so everything the turn did reads above it. One forward walk, no grouping.
  const rows = useMemo<Row[]>(() => {
    const placed: Row[] = [];
    let waiting: Row[] = [];

    for (const message of messages) {
      const summaries = summaryCardsFor(message);

      if (endsTurn(message)) {
        // place summary just above the final answer from the agent
        placed.push(...waiting, ...summaries);
        waiting = [];
      } else {
        waiting.push(...summaries);
      }

      placed.push({ kind: "message", key: message.id, message });
    }

    // A turn still mid-flight has no answer yet; draw what it has.
    return [...placed, ...waiting];
  }, [messages]);

  // One approval card per tool call, decided or open
  const byToolCall = useMemo(() => {
    const map = new Map<string, InterruptView>();
    for (const { interrupt, decision } of resolvedInterrupts) {
      if (interrupt.toolCallId) map.set(interrupt.toolCallId, { interrupt, decision });
    }
    for (const interrupt of interrupts) {
      if (interrupt.toolCallId) map.set(interrupt.toolCallId, { interrupt });
    }
    return map;
  }, [interrupts, resolvedInterrupts]);

  const lastMessageId = messages[messages.length - 1]?.id ?? null;

  return (
    <ScrollArea
      flex={1}
      mih={0}
      type="auto"
      viewportRef={viewportRef}
      onScrollPositionChange={handleScrollPositionChange}
    >
      <Stack gap="md" px="lg" py="md" maw={CHAT_MAX_WIDTH} mx="auto" w="100%">
        {rows.map((row) =>
          row.kind === "message" ? (
            <MessageItem
              key={row.key}
              message={row.message}
              timings={timings}
              toolResults={toolResults}
              interrupts={byToolCall}
              interruptActions={interruptActions}
              editableMessageId={editableMessageId}
              isRunning={isRunning}
              isLast={row.message.id === lastMessageId}
              onEdit={onEdit}
              onRetry={onRetry}
            />
          ) : (
            <ToolResultCard
              key={row.key}
              toolCall={row.toolCall}
              result={toolResults.get(row.toolCall.id) ?? null}
              isRunning={isRunning}
              trailing
            />
          ),
        )}

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
