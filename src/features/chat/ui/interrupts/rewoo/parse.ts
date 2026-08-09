// metadata is agent-defined and untyped, so assume nothing. Same discipline as
// tools/survival/parse.ts, minus the JSON.parse - this input is already an object.

export interface RewooStep {
  /** "#E1". Later steps reference it in their arguments as a placeholder. */
  evidenceId: string | null;
  plan: string;
  toolName: string | null;
  /** Evidence ids this step waits on. The plan is a DAG, not a straight line. */
  dependsOn: string[];
  toolArguments: unknown;
}

// metadata also carries `query`, `status` (PLAN_DRAFTED) and a `message` for the
// human. None are read - the question is the user's own message right above the
// card, and the buttons say what to do.
export interface RewooPlan {
  steps: RewooStep[];
}

export type ParseResult =
  | { ok: true; data: RewooPlan }
  | { ok: false; reason: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export function parseRewooPlan(
  metadata: Record<string, unknown> | null,
): ParseResult {
  if (!isRecord(metadata)) return { ok: false, reason: "no metadata" };
  if (!Array.isArray(metadata.plan)) return { ok: false, reason: "missing plan array" };

  const steps: RewooStep[] = [];
  for (const raw of metadata.plan) {
    if (!isRecord(raw)) continue;
    const plan = str(raw.plan);
    // A step with no description is nothing a human can weigh in on.
    if (!plan) continue;
    steps.push({
      evidenceId: str(raw.evidence_id),
      plan,
      toolName: str(raw.tool_name),
      dependsOn: strArray(raw.predecessors),
      toolArguments: raw.tool_arguments,
    });
  }

  if (steps.length === 0) return { ok: false, reason: "plan had no readable steps" };

  return { ok: true, data: { steps } };
}
