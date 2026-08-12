'use client';

import { useMemo, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useGetCSRFQuery } from '@gen3/core';
import Loading from '@/components/Loading';

const ChatProvider = dynamic(
  () => import('./core/ChatProvider').then((m) => m.ChatProvider),
  { ssr: false, loading: () => <Loading /> },
);

export function ChatRuntimeProvider({ children }: { children: ReactNode }) {
  const { basePath } = useRouter();
  const { data } = useGetCSRFQuery();
  const csrfToken = data?.csrfToken;

  const headers = useMemo(
    () => (csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined),
    [csrfToken],
  );

  return (
    <ChatProvider runtimeUrl={`${basePath}/copilot-runtime`} headers={headers}>
      {children}
    </ChatProvider>
  );
}
