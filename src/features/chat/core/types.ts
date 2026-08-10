// The contract between /core and /ui. UI components depend on these shapes only,
// never on AG-UI or CopilotKit types.

export type ChatRole = "user" | "assistant" | "reasoning" | "tool";

export interface ToolCall {
    id: string;
    name: string;
    args: Record<string, unknown> | null; // parsed from the wire's JSON string
}

export type ChatMessage =
| {
    id: string;
    role: "user";
    content: string
}
| {
    id: string;
    role: "assistant";
    content: string;
    toolCalls?: ToolCall[];
}
| {
    id: string;
    role: "reasoning";
    content: string;
}
| {
      id: string;
      role: "tool";
      toolCallId: string; // ties back to the assistant's ToolCall.id
      content: string;
    };


export interface Timings {
  turns: Record<string, number>;      // userMessageId → ms
  tools: Record<string, number>;      // toolCallId → ms
  reasoning: Record<string, number>;  // reasoningMessageId → ms
}


/**
 * An approval the agent parked on mid-run. Until it's answered the agent refuses
 * every run.
 */
export interface ChatInterrupt {
    id: string;
    /** Backend-defined kind. "tool_call" is the only one we see today. */
    reason: string;
    message: string | null;
    /** Ties back to ToolCall.id, so the card renders against the call it gates. */
    toolCallId: string | null;
    /**
     * Agent-shaped, so narrow it in a renderer the way ui/tools/survival/parse.ts
     * narrows a tool result. `unknown` not `any` - AG-UI types this
     * Record<string, any>, which spreads silently through everything it touches.
     */
    metadata: Record<string, unknown> | null;
    /** The agent accepts a modified tool call. Nothing offers that yet. */
    canEditArgs: boolean;
    /** Epoch ms, so /ui never has to parse an ISO string. */
    expiresAt: number | null;
}

/**
 * Denying resolves the interrupt rather than cancelling it - cancelling can't
 * carry a payload, so this is the only way feedback reaches the agent.
 */
export type InterruptDecision =
    | { approved: true }
    | { approved: false; reason?: string };

/** An approval the agent has accepted, kept so the transcript still shows it. */
export interface ResolvedInterrupt {
    interrupt: ChatInterrupt;
    decision: InterruptDecision;
}
