import type { ChatInterrupt } from "../../core";
import type { InterruptRendererEntry } from "./types";
import { RewooPlanBody } from "./rewoo/RewooPlanBody";
import { parseRewooPlan } from "./rewoo/parse";

const interruptRenderers: Record<string, InterruptRendererEntry | undefined> = {
  rewoo_plan: {
    Body: RewooPlanBody,
    summarize: (interrupt) => {
      const parsed = parseRewooPlan(interrupt.metadata);
      return parsed.ok ? `Plan · ${parsed.data.steps.length} steps` : null;
    },
  },
};

// Can't just index the way toolRenderers[tc.name] does - approval_kind rides in
// untyped metadata, so narrow it first.
export function resolveInterruptRenderer(
  interrupt: ChatInterrupt,
): InterruptRendererEntry | undefined {
  const kind = interrupt.metadata?.approval_kind;
  return typeof kind === "string" ? interruptRenderers[kind] : undefined;
}
