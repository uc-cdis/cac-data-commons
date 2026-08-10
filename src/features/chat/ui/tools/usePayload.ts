"use client";

import { useEffect, useState } from "react";
import { QAG_VERSION } from "@/lib/copilot/qagVersion";

export interface PayloadState {
  data: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * The dev-only credentials_token cookie, sent as a bearer.
 */
function devAuthHeaders(): Record<string, string> {
  if (process.env.NODE_ENV !== "development" || typeof document === "undefined") return {};
  const token = document.cookie.match(/(?:^|;\s*)credentials_token=([^;]*)/)?.[1];
  return token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {};
}

/** Fetches a cached tool payload by handle. A null id fetches nothing. */
export function usePayload(payloadId: string | null): PayloadState {
  const [state, setState] = useState<PayloadState>({
    data: null,
    loading: payloadId !== null,
    error: null,
  });

  useEffect(() => {
    if (!payloadId) return;

    let alive = true;
    setState({ data: null, loading: true, error: null });

    fetch(`/qag/${QAG_VERSION}/cache/${encodeURIComponent(payloadId)}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json", ...devAuthHeaders() },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`payload fetch failed (${res.status})`);
        return res.text();
      })
      .then((text) => {
        if (alive) setState({ data: text, loading: false, error: null });
      })
      .catch((err: unknown) => {
        console.error("[chat-ui:payload]", err);
        if (alive) {
          setState({ data: null, loading: false, error: "Couldn't load the full curve." });
        }
      });

    return () => {
      alive = false;
    };
  }, [payloadId]);

  return state;
}
