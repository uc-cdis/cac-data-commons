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
      content: unwrapToolResult(message.content)
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

/**
 * get_survival_data - and so far only that one - serializes its result as an MCP
 * content-block array, the same `[{type:"text",text}]` shape extractText already flattens
 * for the other two roles, except JSON-encoded into the string because AG-UI types tool
 * content as a string. Peel it at the one place that normalizes the wire rather than in that
 * tool's parser, so the raw RESULT panel stays readable and the next tool to start wrapping
 * needs no change. Anything else passes through untouched, which is what leaves run_query
 * and a denied approval's plain feedback text alone.
 *
 * Once only. The inner text is itself JSON, and that layer belongs to whoever renders it.
 */
function unwrapToolResult(content: string): string {
  if (!content.startsWith("[")) return content; // free reject: results are objects or prose

  const hit = unwrapCache.get(content);
  if (hit !== undefined) return hit;

  const out = peelContentBlocks(content);
  if (unwrapCache.size >= UNWRAP_CACHE_MAX) {
    // Map iterates in insertion order, so this drops the oldest.
    const oldest = unwrapCache.keys().next().value;
    if (oldest !== undefined) unwrapCache.delete(oldest);
  }
  unwrapCache.set(content, out);
  return out;
}

// toChatMessage re-runs over the whole transcript on every streamed token, so a wrapped
// result would otherwise re-parse per token for the life of the conversation. Keyed on the
// string rather than the message, which the dev-mode structuredClone would defeat.
const UNWRAP_CACHE_MAX = 64;
const unwrapCache = new Map<string, string>();

function peelContentBlocks(content: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return content;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return content;

  // every, not extractText's filter. Dropping an unrecognised part is right for multimodal
  // user content and wrong here - a half-decoded result is worse than an undecoded one, so
  // an array we only partly recognise gets handed back whole. Extra keys are ignored; the
  // envelope carries `annotations` and `meta` we have no use for.
  const texts: string[] = [];
  for (const part of parsed) {
    if (
      typeof part !== "object" ||
      part === null ||
      (part as { type?: unknown }).type !== "text" ||
      typeof (part as { text?: unknown }).text !== "string"
    ) {
      return content;
    }
    texts.push((part as { text: string }).text);
  }

  return texts.join("");
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
