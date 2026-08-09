import type { ComponentType } from "react";
import type { ChatInterrupt, ToolCall } from "../../core";

export interface InterruptActions {
  onApprove: (id: string) => void;
  onDeny: (id: string, reason?: string) => void;
  /**
   * Answered but not sent. One resume covers every open approval, so with more
   * than one on screen the early answers wait here for the last.
   */
  answeredIds: ReadonlySet<string>;
  /** A decision is on the wire. Only one can be, so this isn't keyed by id. */
  submitting: boolean;
}

/**
 * A renderer draws the body only. Buttons and chrome stay in InterruptCard, so a
 * new one can't forget the deny path or invent its own styling.
 */
export interface InterruptRendererProps {
  interrupt: ChatInterrupt;
  /** The call being gated, when its toolCallId matched something on screen. */
  toolCall: ToolCall | null;
}

export type InterruptRenderer = ComponentType<InterruptRendererProps>;

export interface InterruptRendererEntry {
  Body: InterruptRenderer;
  /**
   * Label for the collapsed row once a decision is in. Only the renderer knows
   * what it drew - "Plan · 6 steps" needs the step count.
   */
  summarize?: (interrupt: ChatInterrupt) => string | null;
}
