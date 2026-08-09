import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildResumeArray,
  isInterruptExpired,
  type AbstractAgent,
  type CopilotKitCore,
  type ResumeEntry,
} from "@copilotkit/react-core/v2";
import type { ChatInterrupt, InterruptDecision, ResolvedInterrupt } from "./types";
import { toChatInterrupt } from "./utils";
import { reportError } from "./errors";

export interface UseChatInterrupts {
  /** Open approvals. Blocks every run until answered. */
  interrupts: ChatInterrupt[];
  /** Accepted approvals, oldest first. */
  resolved: ResolvedInterrupt[];
  answeredIds: string[];
  submitting: boolean;
  /** Fires the resume once every open interrupt is answered. */
  answer: (id: string, decision: InterruptDecision) => void;
  /** Stable across renders; persistence depends on it. */
  getResolved: () => ResolvedInterrupt[];
  /** Seed history from a stored chat. Never re-arms. */
  adopt: (restored: ResolvedInterrupt[]) => void;
  /** Unarm and drop history. Only when leaving the chat. */
  clear: () => void;
}

/** Deny resolves, not cancels - cancel can't carry a reason. */
type ResumeResponse =
  | { status: "resolved"; payload?: unknown }
  | { status: "cancelled" };

function toResponse(decision: InterruptDecision): ResumeResponse {
  return decision.approved
    ? { status: "resolved", payload: { approved: true } }
    : {
        status: "resolved",
        payload: { approved: false, ...(decision.reason ? { reason: decision.reason } : {}) },
      };
}

/**
 * The human-in-the-loop gate: keeps React state in sync with
 * `agent.pendingInterrupts`, which blocks every run until answered.
 */
export function useChatInterrupts(
  agent: AbstractAgent,
  copilotkit: CopilotKitCore,
): UseChatInterrupts {
  // The agent outlives this hook; a remount can land on an armed approval.
  const [interrupts, setInterrupts] = useState<ChatInterrupt[]>(() =>
    agent.pendingInterrupts.map(toChatInterrupt),
  );
  const [resolved, setResolved] = useState<ResolvedInterrupt[]>([]);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Read in the tick the last answer lands, before state catches up.
  const answersRef = useRef<Record<string, InterruptDecision>>({});
  // In flight until finalize says which stuck.
  const submittedRef = useRef<ResolvedInterrupt[]>([]);
  const resolvedRef = useRef<ResolvedInterrupt[]>([]);

  const putResolved = useCallback((next: ResolvedInterrupt[]) => {
    resolvedRef.current = next;
    setResolved(next);
  }, []);
  // Not state: two fast clicks would answer the same interrupt twice.
  const submittingRef = useRef(false);

  const resetAnswers = useCallback(() => {
    answersRef.current = {};
    submittingRef.current = false;
    setAnsweredIds([]);
    setSubmitting(false);
  }, []);

  // Leaves `resolved` alone - the next save writes it.
  const unarm = useCallback(() => {
    agent.pendingInterrupts = [];
    resetAnswers();
    submittedRef.current = [];
    setInterrupts((prev) => (prev.length === 0 ? prev : []));
  }, [agent, resetAnswers]);

  // [agent] only: runAgent snapshots subscribers, so a mid-run resubscribe is lost.
  useEffect(() => {
    const sub = agent.subscribe({
      // onRunFinalized puts the card back if the resume dies.
      onRunStartedEvent() {
        setInterrupts((prev) => (prev.length === 0 ? prev : []));
      },

      // Runs before useChatPersistence, which writes the row from this same event.
      // params.interrupts, not the field - the applier hasn't written it yet.
      onRunFinishedEvent(params) {
        const stillOpen =
          params.outcome === "interrupt"
            ? new Set(params.interrupts.map((i) => i.id))
            : new Set<string>();

        // Came back open = the resume missed; keeping it would duplicate the card.
        const accepted = submittedRef.current.filter((r) => !stillOpen.has(r.interrupt.id));
        submittedRef.current = [];
        if (accepted.length) putResolved([...resolvedRef.current, ...accepted]);
      },

      // Fires on every terminal path; the only trustworthy read of the field.
      onRunFinalized() {
        resetAnswers();
        submittedRef.current = [];

        const open = agent.pendingInterrupts;
        setInterrupts((prev) =>
          open.length === 0 && prev.length === 0 ? prev : open.map(toChatInterrupt),
        );
      },
    });
    return () => sub.unsubscribe();
  }, [agent, resetAnswers]);

  // Stale ids outlive setMessages and a threadId swap. Mid-run, use unarm().
  const clear = useCallback(() => {
    unarm();
    putResolved([]);
  }, [unarm, putResolved]);

  const submit = useCallback(
    (decisions: Record<string, InterruptDecision>) => {
      // The field, not our mirror - it's what the pre-flight check reads.
      const open = agent.pendingInterrupts;
      if (open.length === 0 || agent.isRunning || submittingRef.current) return;
      if (open.some((i) => !decisions[i.id])) return; // still waiting on the rest

      // Expired throws pre-flight even with resume; unarm or nothing works again.
      if (open.some((i) => isInterruptExpired(i))) {
        unarm();
        reportError("interrupt", new Error("This approval expired. Ask again."));
        return;
      }

      let resume: ResumeEntry[];
      try {
        const responses: Record<string, ResumeResponse> = {};
        for (const i of open) responses[i.id] = toResponse(decisions[i.id]);
        // Throws on an unknown id, inside a click handler React won't catch.
        resume = buildResumeArray(open, responses);
      } catch (err) {
        unarm();
        reportError("interrupt", err);
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      // Provisional until finalize.
      submittedRef.current = open.map((i) => ({
        interrupt: toChatInterrupt(i),
        decision: decisions[i.id],
      }));

      // No synthetic tool result, unlike CopilotKit's useInterrupt - the agent emits
      // TOOL_CALL_RESULT itself, and the applier doesn't dedupe by toolCallId.
      void copilotkit
        .runAgent({ agent, resume })
        // runAgent already reports via onError; this only avoids an unhandled reject.
        .catch((err) => reportError("interrupt", err))
        .finally(() => {
          submittingRef.current = false;
          setSubmitting(false);
        });
    },
    [agent, copilotkit, unarm],
  );

  const answer = useCallback(
    (id: string, decision: InterruptDecision) => {
      if (submittingRef.current) return;
      answersRef.current = { ...answersRef.current, [id]: decision };
      setAnsweredIds(Object.keys(answersRef.current));
      submit(answersRef.current);
    },
    [submit],
  );

  const getResolved = useCallback(() => resolvedRef.current, []);

  // Re-arming one the server forgot would render an Approve button that can't work.
  const adopt = useCallback(
    (restored: ResolvedInterrupt[]) => {
      if (restored.length) putResolved(restored);
    },
    [putResolved],
  );

  return { interrupts, resolved, answeredIds, submitting, answer, getResolved, adopt, clear };
}
