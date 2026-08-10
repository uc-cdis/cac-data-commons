import type { ComponentType } from "react";
import type { ToolCall } from "../../core";

export interface ToolRendererProps {
  toolCall: ToolCall;
  /** null until TOOL_CALL_RESULT lands */
  result: string | null;
}

export type ToolRenderer = ComponentType<ToolRendererProps>;

export interface ToolRendererEntry {
  Component: ToolRenderer;
  /**
   * Render after every tool panel in the message and immediately above the answer,
   * instead of under the call it hangs off. For a result that reports on the whole turn
   * rather than on that one call.
   */
  trailing?: boolean;
}
