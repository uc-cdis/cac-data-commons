 "use client";

import { Fragment, useState } from "react";
import { Stack } from "@mantine/core";
import type { ChatMessage, Timings } from "../../core";
import { MessageBubble } from "./MessageBubble";
import { ToolCallPanel } from "./ToolCallPanel";
import { ToolResultCard } from "../tools";
import { InterruptCard } from "../interrupts";
import type { InterruptActions, InterruptView } from "../interrupts";

type AssistantChatMessage = Extract<ChatMessage, { role: "assistant" }>;

export interface AssistantMessageProps {
  message: AssistantChatMessage;
  timings: Timings;
  toolResults: ReadonlyMap<string, string>;
  interrupts: ReadonlyMap<string, InterruptView>;
  interruptActions: InterruptActions;
  isRunning: boolean;
}


export function AssistantMessage({
  message,
  timings,
  toolResults,
  interrupts,
  interruptActions,
  isRunning,
}: AssistantMessageProps) {
  const [openedCallId, setOpenedCallId] = useState<string | null>(null);

  return (
    <Stack gap="xs">
      {(message.toolCalls ?? []).map((tc) => {
        const result = toolResults.get(tc.id) ?? null;
        const approval = interrupts.get(tc.id);

        // Approval, then the call, then its output
        return (
          <Fragment key={tc.id}>
            {approval && (
              <InterruptCard
                interrupt={approval.interrupt}
                toolCall={tc}
                actions={interruptActions}
                decision={approval.decision}
              />
            )}
            <ToolCallPanel
              toolCall={tc}
              result={result}
              isRunning={isRunning}
              awaitingApproval={approval !== undefined && approval.decision === undefined}
              durationMs={timings.tools?.[tc.id]}
              isExpanded={openedCallId === tc.id}
              onToggle={() => setOpenedCallId(openedCallId === tc.id ? null : tc.id)}
            />
            <ToolResultCard toolCall={tc} result={result} isRunning={isRunning} />
          </Fragment>
        );
      })}

      {message.content && (
        <MessageBubble message={{ ...message, toolCalls: undefined }} />
      )}
    </Stack>
  );
}
