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
  /** Decided approvals, oldest first. */
  resolved: ResolvedInterrupt[];
  submitting: boolean;
  /** Records the decision and fires the resume. */
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
  model: string,
): UseChatInterrupts {
  // The agent outlives this hook; a remount can land on an armed approval.
  const [interrupts, setInterrupts] = useState<ChatInterrupt[]>(() =>
    agent.pendingInterrupts.map(toChatInterrupt),
  );
  const [resolved, setResolved] = useState<ResolvedInterrupt[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const resolvedRef = useRef<ResolvedInterrupt[]>([]);
  const putResolved = useCallback((next: ResolvedInterrupt[]) => {
    resolvedRef.current = next;
    setResolved(next);
  }, []);

  const submittingRef = useRef(false);

  const stopSubmitting = useCallback(() => {
    submittingRef.current = false;
    setSubmitting(false);
  }, []);

  // Leaves `resolved` alone - the next save writes it.
  const unarm = useCallback(() => {
    agent.pendingInterrupts = [];
    stopSubmitting();
    setInterrupts((prev) => (prev.length === 0 ? prev : []));
  }, [agent, stopSubmitting]);

  // [agent] only: runAgent snapshots subscribers, so a mid-run resubscribe is lost.
  useEffect(() => {
    const sub = agent.subscribe({
      // onRunFinalized puts the card back if the resume dies.
      onRunStartedEvent() {
        setInterrupts((prev) => (prev.length === 0 ? prev : []));
      },

      // Fires on every terminal path; the only trustworthy read of the field.
      onRunFinalized() {
        stopSubmitting();

        const open = agent.pendingInterrupts;
        setInterrupts((prev) =>
          open.length === 0 && prev.length === 0 ? prev : open.map(toChatInterrupt),
        );
      },
    });
    return () => sub.unsubscribe();
  }, [agent, stopSubmitting]);

  // Stale ids outlive setMessages and a threadId swap. Mid-run, use unarm().
  const clear = useCallback(() => {
    unarm();
    putResolved([]);
  }, [unarm, putResolved]);

  const answer = useCallback(
    (id: string, decision: InterruptDecision) => {
      // The field, not our mirror - it's what the pre-flight check reads.
      const open = agent.pendingInterrupts;
      if (open.length === 0 || agent.isRunning || submittingRef.current) return;

      const target = open.find((i) => i.id === id);
      if (!target) return; // a card outliving its interrupt

      // Expired throws pre-flight even with resume; unarm or nothing works again.
      if (open.some((i) => isInterruptExpired(i))) {
        unarm();
        reportError("interrupt", new Error("This approval expired. Ask again."));
        return;
      }

      let resume: ResumeEntry[];
      try {
        resume = buildResumeArray(open, { [target.id]: toResponse(decision) });
      } catch (err) {
        unarm();
        reportError("interrupt", err);
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);


      putResolved([...resolvedRef.current, { interrupt: toChatInterrupt(target), decision }]);

      void copilotkit
        .runAgent({ agent, resume, forwardedProps: { model } })
        .catch((err) => reportError("interrupt", err))
        .finally(stopSubmitting);
    },
    [agent, copilotkit, unarm, putResolved, stopSubmitting, model],
  );

  const getResolved = useCallback(() => resolvedRef.current, []);

  // Re-arming one the server forgot would render an Approve button that can't work.
  const adopt = useCallback(
    (restored: ResolvedInterrupt[]) => {
      if (restored.length) putResolved(restored);
    },
    [putResolved],
  );

  return { interrupts, resolved, submitting, answer, getResolved, adopt, clear };
}
