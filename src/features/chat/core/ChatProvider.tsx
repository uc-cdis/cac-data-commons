"use client";

import type { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";

export interface ChatProviderProps {
    /** Same-origin path to the CopilotKit runtime, e.g. `/api/copilotkit`. */
    runtimeUrl: string;
    children: ReactNode;
}

export function ChatProvider({ runtimeUrl, children }: ChatProviderProps) {
    // No agent is constructed here. It used to be an HttpAgent with the bearer token
    // in its headers, which put the token in the client bundle as a NEXT_PUBLIC_ var
    // and evaporated the conversation on every rotation. The runtime owns both now:
    // it reads the Gen3 token from the cookie per request, and this never sees it.
    return (
        <CopilotKit
            runtimeUrl={runtimeUrl}
            useSingleEndpoint
            enableInspector={process.env.NODE_ENV !== "production"}
            // Keeps CopilotKit's error banner from stacking on top of ours. Unset it
            // defaults to isLocalhost(). Deprecated as an inspector toggle only - it
            // still gates the banners.
            showDevConsole={false}
        >
            {children}
        </CopilotKit>
    )
}
