import { CopilotRuntime } from '@copilotkit/runtime';
import { HttpAgent } from '@ag-ui/client';
import { getChatAgentUrl } from './env';

let runtime: CopilotRuntime | null = null;

export const getCopilotRuntime = (): CopilotRuntime => {
  if (runtime) return runtime;
  const agentUrl = getChatAgentUrl();

  // receives requests from a frontend chat app and dispatched them to agent which is supposed to handle them
  runtime = new CopilotRuntime({
    agents: ({ request }) => {
      const authorization = request.headers.get('authorization');
      return {
        default: new HttpAgent({ // client class implementating AG-UI protocol over plain HTTP
          url: agentUrl,
          headers: {
            ...(authorization ? { Authorization: authorization } : {}),
            // HttpAgent sets no Accept-Encoding, so undici advertises gzip and a
            // compressing origin batches the whole answer. Doing client's part for streaming.
            'Accept-Encoding': 'identity',
          },
        }),
      };
    },
  });

  return runtime;
};
