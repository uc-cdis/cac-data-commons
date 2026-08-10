import type { ComponentType } from "react";
import type { ChatInterrupt, InterruptDecision, ToolCall } from "../../core";


export interface InterruptView {
  interrupt: ChatInterrupt;
  decision?: InterruptDecision;
}

export interface InterruptActions {
  onApprove: (id: string) => void;
  onDeny: (id: string, reason?: string) => void;
  answeredIds: ReadonlySet<string>;
  submitting: boolean;
}

export interface InterruptRendererProps {
  interrupt: ChatInterrupt;
  /** The call being gated, when its toolCallId matched something on screen. */
  toolCall: ToolCall | null;
}

export type InterruptRenderer = ComponentType<InterruptRendererProps>;

export interface InterruptRendererEntry {
  Body: InterruptRenderer;
  summarize?: (interrupt: ChatInterrupt) => string | null;
}
