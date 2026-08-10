import type { NextApiRequest, NextApiResponse } from 'next';
import { copilotRuntimeNextJSPagesRouterEndpoint } from '@copilotkit/runtime';
import { authenticateCopilotRequest } from '@/lib/copilot/auth';
import { getCopilotRuntime } from '@/lib/copilot/runtime';

// Overrides CopilotKit's bodyParser:false -- the auth await drains the request
// stream, so the runtime finds no body and every call 400s.
export const config = { api: { bodyParser: true } };

const ENDPOINT = '/api/copilotkit';

// CopilotKit probes for the agent list on every page load, which 401d for
// logged-out visitors. Safe anonymously: `info` only enumerates the agents map.
const isRuntimeInfoProbe = (req: NextApiRequest) =>
  (req.body as { method?: unknown } | undefined)?.method === 'info';

let endpointHandler: ReturnType<
  typeof copilotRuntimeNextJSPagesRouterEndpoint
> | null = null;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!isRuntimeInfoProbe(req)) {
      const token = await authenticateCopilotRequest(req.headers.cookie);
      if (!token) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      req.headers.authorization = `Bearer ${token}`; // read back in runtime.ts
    }

    // SSE responses must reach the browser unbuffered and uncompressed, or the
    // client gets one blob at the end instead of token-by-token output. The
    // agent-call hop is guarded in runtime.ts; these two lines guard the other
    // two hops -- Next's own gzip, and an nginx-style reverse proxy.
    req.headers['accept-encoding'] = 'identity';
    res.setHeader('X-Accel-Buffering', 'no');

    // The runtime pipes a Readable into res without listening for its errors, so
    // an agent dying mid-answer hangs the socket. Destroy instead.
    res.once('pipe', (source: NodeJS.ReadableStream) => {
      source.on('error', (streamError: Error) => {
        console.error(
          '[copilotkit] Agent stream failed mid-response:',
          streamError,
        );
        if (!res.writableEnded) res.destroy();
      });
    });

    // Built lazily so missing config is a 500, not a server that won't boot.
    endpointHandler ??= copilotRuntimeNextJSPagesRouterEndpoint({
      runtime: getCopilotRuntime(),
      endpoint: ENDPOINT,
    });

    await endpointHandler(req, res);
  } catch (error) {
    console.error('[copilotkit] Handler threw:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Copilot runtime error.' });
      return;
    }
    res.end();
  }
};

export default handler;
