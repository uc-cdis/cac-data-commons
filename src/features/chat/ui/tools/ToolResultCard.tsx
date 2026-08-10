"use client";

import type { ToolCall } from "../../core";
import { toolRenderers } from "./registry";

export interface ToolResultCardProps {
  toolCall: ToolCall;
  result: string | null;
  isRunning: boolean;
  /** Which placement is asking. A card renders at exactly one of the two. */
  trailing?: boolean;
}


export function ToolResultCard({
  toolCall,
  result,
  isRunning,
  trailing = false,
}: ToolResultCardProps) {
  const entry = toolRenderers[toolCall.name];
  if (!entry || Boolean(entry.trailing) !== trailing) return null;
  if (!result && !isRunning) return null;

  return <entry.Component toolCall={toolCall} result={result} />;
}
