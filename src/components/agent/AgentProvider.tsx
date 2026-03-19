"use client";
import React from "react";
import { CopilotKit } from "@copilotkit/react-core";

/**
 * AgentProvider
 *
 * Wraps the app (or a subtree) with the CopilotKit context.
 * All useAgent / useCoAgent / useCopilotChat hooks must live
 * inside this boundary.
 *
 * runtimeUrl points at the Next.js API route that proxies to
 * your FastAPI / LangGraph backend via CopilotRuntime.
 */
export function AgentProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" publicApiKey={undefined}>
    {children}
    </CopilotKit>
);
}
