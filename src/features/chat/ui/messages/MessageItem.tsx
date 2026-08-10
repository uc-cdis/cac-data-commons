"use client";

import type { ChatMessage, Timings } from "../../core";
import { ReasoningBlock } from "./ReasoningBlock";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";
import type { InterruptActions, InterruptView } from "../interrupts";

export interface MessageItemProps {
  message: ChatMessage;
  timings: Timings;
  toolResults: ReadonlyMap<string, string>;
  interrupts: ReadonlyMap<string, InterruptView>;
  interruptActions: InterruptActions;
  editableMessageId: string | null;
  isRunning: boolean;
  /** Last in the list. Only the tail can be mid-stream. */
  isLast: boolean;
  onEdit: (text: string) => void;
  onRetry: () => void;
}

export function MessageItem({
  message,
  timings,
  toolResults,
  interrupts,
  interruptActions,
  editableMessageId,
  isRunning,
  isLast,
  onEdit,
  onRetry,
}: MessageItemProps) {
  if (message.role === "user") {
    return (
      <UserMessage
        message={message}
        durationMs={timings.turns?.[message.id]}
        canRewind={message.id === editableMessageId}
        onEdit={onEdit}
        onRetry={onRetry}
      />
    );
  }

  if (message.role === "reasoning") {
    return (
      <ReasoningBlock
        content={message.content}
        durationMs={timings.reasoning?.[message.id]}
        isStreaming={isRunning && isLast}
      />
    );
  }

  // Tool results render inside their assistant message's ToolCallPanel.
  if (message.role === "tool") return null;

  return (
    <AssistantMessage
      message={message}
      timings={timings}
      toolResults={toolResults}
      interrupts={interrupts}
      interruptActions={interruptActions}
      isRunning={isRunning}
    />
  );
}
