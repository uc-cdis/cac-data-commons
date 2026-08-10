// The result arrives as an untrusted string from a tool call, so assume nothing.
// Same discipline as ../survival/parse.ts.

export interface AgentReport {
  answer: string;
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
