"use client";

import { Fragment, useState } from "react";
import {  Stack } from "@mantine/core";
import type { ChatInterrupt, ChatMessage, ResolvedInterrupt, Timings } from "../../core";
import { MessageBubble } from "./MessageBubble";
import { ToolCallPanel } from "./ToolCallPanel";
import { toolRenderers } from "../tools";
import { InterruptCard } from "../interrupts";
import type { InterruptActions } from "../interrupts";

type AssistantChatMessage = Extract<ChatMessage, { role: "assistant" }>;

export interface AssistantMessageProps {
  message: AssistantChatMessage;
  timings: Timings;
  toolResults: ReadonlyMap<string, string>;
  /** Open approvals, keyed by the tool call each one gates. */
  interrupts: ReadonlyMap<string, ChatInterrupt>;
  /** Already decided, same keying. Kept so the plan stays in the transcript. */
  resolvedInterrupts: ReadonlyMap<string, ResolvedInterrupt>;
  interruptActions: InterruptActions;
  isRunning: boolean;
}

export function AssistantMessage({
  message,
  timings,
  toolResults,
  interrupts,
  resolvedInterrupts,
  interruptActions,
  isRunning,
}: AssistantMessageProps) {
  const [openedCallId, setOpenedCallId] = useState<string | null>(null);
  const hasTools = message.toolCalls && message.toolCalls.length > 0;

  return (
      <Stack gap="xs">
        {message.content && (
          <MessageBubble message={{ ...message, toolCalls: undefined }} />
        )}
        {hasTools && (
            <>
             {message.toolCalls?.map((tc) => {
              const result = toolResults.get(tc.id) ?? null;
              const interrupt = interrupts.get(tc.id);
              const decided = resolvedInterrupts.get(tc.id);
              const Renderer = toolRenderers[tc.name];

              return (
                // Approval, then the call, then its output. The approval gates the
                // call so it leads, and the compact panel row then reads as a
                // heading for the output rather than a footer.
                <Fragment key={tc.id}>
                  {interrupt ? (
                    <InterruptCard
                      interrupt={interrupt}
                      toolCall={tc}
                      actions={interruptActions}
                    />
                  ) : (
                    decided && (
                      <InterruptCard
                        interrupt={decided.interrupt}
                        toolCall={tc}
                        actions={interruptActions}
                        decision={decided.decision}
                      />
                    )
                  )}
                  <ToolCallPanel
                    toolCall={tc}
                    result={result}
                    isRunning={isRunning}
                    awaitingApproval={interrupt !== undefined}
                    durationMs={timings.tools?.[tc.id]}
                    isExpanded={openedCallId === tc.id}
                    onToggle={() => setOpenedCallId(openedCallId === tc.id ? null : tc.id)}
                  />
                  {/* hide a resultless custom renderer once the run is over -
                      otherwise its loading skeleton hangs around forever */}
                  {Renderer && (result || isRunning) && (
                    <Renderer toolCall={tc} result={result} />
                  )}
                </Fragment>
              );
            })}
            </>
        )}
      </Stack>
  );
}
