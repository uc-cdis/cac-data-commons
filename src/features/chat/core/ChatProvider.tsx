"use client";

import type { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";

export interface ChatProviderProps {
    runtimeUrl: string;
    children: ReactNode;
}

export function ChatProvider({ runtimeUrl, children }: ChatProviderProps) {
    const inspectorEnabled =
        process.env.NODE_ENV !== "production" &&
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("copilotInspector");

    return (
        <CopilotKit
            runtimeUrl={runtimeUrl}
            useSingleEndpoint
            enableInspector={inspectorEnabled}
            showDevConsole={false}
        >
            {children}
        </CopilotKit>
    )
}
