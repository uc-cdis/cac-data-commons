export interface SummaryStat {
  label: string;
  value: number;
}

export interface PayloadRef {
  payloadId: string;
  summary: SummaryStat[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Untrusted string from a tool call, so assume nothing. Same discipline as survival/parse.ts. */
export function readPayloadRef(content: string): PayloadRef | null {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return null;
  }
  if (!isRecord(raw)) return null;
  if (typeof raw.payload_id !== "string" || !raw.payload_id) return null;

  // An array of objects on the wire. Flatten every entry in order rather than looking for
  // names we'd then have to keep in sync with the agent.
  const summary: SummaryStat[] = [];
  if (Array.isArray(raw.summary_stats)) {
    for (const entry of raw.summary_stats) {
      if (!isRecord(entry)) continue;
      for (const [label, value] of Object.entries(entry)) {
        if (typeof value === "number" && Number.isFinite(value)) {
          summary.push({ label, value });
        }
      }
    }
  }

  return { payloadId: raw.payload_id, summary };
}
