// The result arrives as an untrusted string from a tool call, so assume nothing.
// Same discipline as ../survival/parse.ts.

export interface AgentReport {
  /** Markdown. The agent's full working - problem, evidence table, conclusion. */
  answer: string;
  /** "SOLVED" on the runs we've seen. Anything else is worth surfacing. */
  status: string | null;
}

export type ParseResult =
  | { ok: true; data: AgentReport }
  | { ok: false; reason: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function parseAgentReport(content: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return { ok: false, reason: "not valid JSON" };
  }

  if (!isRecord(raw)) return { ok: false, reason: "not an object" };

  const answer = raw.answer;
  // A deny puts the user's feedback text here instead of a report, and a failed
  // run may carry no answer at all. Neither is ours to render.
  if (typeof answer !== "string" || answer.trim().length === 0) {
    return { ok: false, reason: "no answer" };
  }

  return {
    ok: true,
    data: {
      answer,
      status: typeof raw.status === "string" ? raw.status : null,
    },
  };
}
