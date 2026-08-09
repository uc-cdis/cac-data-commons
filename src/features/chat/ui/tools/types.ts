import type { ComponentType } from "react";
import type { ToolCall } from "../../core";

export interface ToolRendererProps {
  toolCall: ToolCall;
  /** null until TOOL_CALL_RESULT lands */
  result: string | null;
}

export type ToolRenderer = ComponentType<ToolRendererProps>;
