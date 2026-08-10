"use client";

import { useMemo } from "react";
import { useChat } from "../core";
import type { InterruptActions } from "./interrupts";
import { ChatShell } from "./ChatShell";
import { ChatSidebar } from "./ChatSidebar";
import { ChatInput } from "./ChatInput";
import { ScrollArea, Stack } from "@mantine/core";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { MessageList } from "./messages";
import { CHAT_MAX_WIDTH } from "./util";

export interface ChatProps {
  agentId?: string;
}

const BLOCKED_BY_APPROVAL = "Respond to the plan above to continue.";

export function Chat({ agentId }: ChatProps) {
  const {
    messages,
    isRunning,
    sendMessage,
    stopRun,
    clearMessages,
    timings,
    chatId,
    chats,
    chatsLoading,
    selectChat,
    renameChat,
    deleteChat,
    error,
    clearError,
    stopped,
    retry,
    editableMessageId,
    editAndRerun,
    interrupts,
    awaitingApproval,
    resolvedInterrupts,
    answeredInterruptIds,
    interruptSubmitting,
    answerInterrupt,
  } = useChat({ agentId });

  const isEmpty = messages.length === 0 && !isRunning;

  const interruptActions = useMemo<InterruptActions>(
    () => ({
      onApprove: (id) => answerInterrupt(id, { approved: true }),
      onDeny: (id, reason) => answerInterrupt(id, { approved: false, reason }),
      answeredIds: new Set(answeredInterruptIds),
      submitting: interruptSubmitting,
    }),
    [answerInterrupt, answeredInterruptIds, interruptSubmitting],
  );

  return (
    <ChatShell
      sidebar={
        <ChatSidebar
          chats={chats}
          activeChatId={chatId}
          loading={chatsLoading}
          isRunning={isRunning}
          onNewConversation={clearMessages}
          onSelect={(id) => selectChat(id)}
          onRename={(id, title) => renameChat(id, title)}
          onDelete={(id) => deleteChat(id)}
        />
      }
    >
      <Stack flex={1} mih={0} miw={0} gap={0}>
        {isEmpty ? (
          <ScrollArea flex={1} mih={0}>
            <Stack gap="md" maw={CHAT_MAX_WIDTH} mx="auto" w="100%" px="lg" pt="xl">
              {error && <ErrorBanner error={error} onDismiss={clearError} />}
              <ChatInput
                isRunning={isRunning}
                onSend={sendMessage}
                onStop={stopRun}
                label="What would you like to know?"
                placeholder="Ask me a question about GDC data — example questions are available below."
              />
              <EmptyState onSelect={sendMessage} disabled={isRunning} />
            </Stack>
          </ScrollArea>
        ) : (
          <>
            <MessageList
              messages={messages}
              isRunning={isRunning}
              timings={timings}
              stopped={stopped}
              hasError={error !== null}
              interrupts={interrupts}
              resolvedInterrupts={resolvedInterrupts}
              interruptActions={interruptActions}
              editableMessageId={editableMessageId}
              onRetry={retry}
              onEdit={editAndRerun}
            />

            <Stack
              gap="xs"
              maw={CHAT_MAX_WIDTH}
              mx="auto"
              w="100%"
              px="lg"
              pt="xs"
              pb="md"
              style={{ flexShrink: 0 }}
            >
              {error && <ErrorBanner error={error} onDismiss={clearError} />}

              <ChatInput
                isRunning={isRunning}
                blockedReason={awaitingApproval ? BLOCKED_BY_APPROVAL : undefined}
                onSend={sendMessage}
                onStop={stopRun}
                placeholder={
                  awaitingApproval
                    ? BLOCKED_BY_APPROVAL
                    : "Ask me a question about GDC data ..."
                }
              />
            </Stack>
          </>
        )}
      </Stack>
    </ChatShell>
  );
}
