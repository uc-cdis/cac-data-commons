"use client";

import type { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";

const NO_HEADERS: Record<string, string> = {};

export interface ChatProviderProps {
    runtimeUrl: string;
    headers?: Record<string, string>;
    children: ReactNode;
}

export function ChatProvider({ runtimeUrl, headers, children }: ChatProviderProps) {
    const inspectorEnabled =
        process.env.NODE_ENV !== "production" &&
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("copilotInspector");

    return (
        <CopilotKit
            runtimeUrl={runtimeUrl}
            headers={headers ?? NO_HEADERS}
            useSingleEndpoint
            enableInspector={inspectorEnabled}
            showDevConsole={false}
        >
            {children}
        </CopilotKit>
    )
}
