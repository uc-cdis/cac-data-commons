'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Loading from '@/components/Loading';

const ChatProvider = dynamic(
  () => import('./core/ChatProvider').then((m) => m.ChatProvider),
  { ssr: false, loading: () => <Loading /> },
);

export function ChatRuntimeProvider({ children }: { children: ReactNode }) {
  const { basePath } = useRouter();

  return (
    <ChatProvider runtimeUrl={`${basePath}/api/copilotkit`}>
      {children}
    </ChatProvider>
  );
}
