import type { Interrupt, Message } from "@copilotkit/react-core/v2";
import type { ChatInterrupt, ChatMessage, ToolCall } from "./types";

// Message -> ChatMessage. Lossy for now; more of the agent's message fields will
// need to come across as the UI grows.
export function toChatMessage(message: Message): ChatMessage[] {
  if (message.role === "user") {
    const text = extractText(message.content);
    if(!text) return [];
    return [{id: message.id, role: "user", content: text}]
  }

  if(message.role === "assistant") {
    const text = extractText(message.content);
    const toolCalls: ToolCall[] = (message.toolCalls ?? []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      args: parseArgs(tc.function.arguments),
    }));

    if (!text && toolCalls.length === 0) return [];

    return [{ id: message.id, role: "assistant", content: text, toolCalls }];
  }


  if (message.role === "reasoning") {
    const text = typeof message.content === "string" ? message.content : "";
    if (!text) return [];

    return [{ id: message.id, role: "reasoning", content: text }];
  }

  if (message.role === "tool") {
    return [{
      id: message.id,
      role: "tool",
      toolCallId: message.toolCallId,
      content: message.content
    }];
  }

  return []
}


/** Arguments arrive as a growing string, so they only parse once complete. */
function parseArgs(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** AG-UI content can be a plain string or an array of multimodal parts. */
function extractText(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .filter(
        (part): part is { type: "text"; text: string } =>
          typeof part === "object" &&
          part !== null &&
          (part as { type?: unknown }).type === "text" &&
          typeof (part as { text?: unknown }).text === "string",
      )
      .map((part) => part.text)
      .join("");
  }

  return "";
}


/** Index of the most recent user message, or -1 if there is none. */
export function lastUserIndex(messages: Message[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return i;
  }
  return -1;
}


/**
 * Interrupt -> ChatInterrupt. Total, unlike toChatMessage's drop-the-empties
 * flatMap: one we refuse to translate is one the user can never answer, which
 * blocks every run after it. Never report from here - it runs in a render memo.
 */
export function toChatInterrupt(interrupt: Interrupt): ChatInterrupt {
  return {
    id: interrupt.id,
    reason: interrupt.reason,
    message: interrupt.message ?? null,
    toolCallId: interrupt.toolCallId ?? null,
    metadata: (interrupt.metadata as Record<string, unknown> | undefined) ?? null,
    canEditArgs: advertisesEditedArgs(interrupt.responseSchema),
    expiresAt: toEpochMs(interrupt.expiresAt),
  };
}

/**
 * responseSchema is JSON Schema for the resume payload. We don't render forms from
 * it - the only thing we read is whether the agent will take edited args.
 */
function advertisesEditedArgs(schema: unknown): boolean {
  if (typeof schema !== "object" || schema === null) return false;
  const properties = (schema as { properties?: unknown }).properties;
  return (
    typeof properties === "object" &&
    properties !== null &&
    "editedArgs" in properties
  );
}

/** expiresAt is ISO-8601 on the wire. Junk dates count as no expiry. */
function toEpochMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}
