"use client";

import { useState } from "react";
import { ActionIcon, Button, CopyButton, Group, Stack, Textarea, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy, IconPencil, IconRefresh } from "@tabler/icons-react";
import type { ChatMessage } from "../../core";
import { MessageBubble } from "./MessageBubble";
import { RunStatusBanner } from "./RunStatusBanner";

type UserChatMessage = Extract<ChatMessage, { role: "user" }>;

export interface UserMessageProps {
  message: UserChatMessage;
  durationMs?: number;
  canRewind: boolean;
  onEdit: (text: string) => void;
  onRetry: () => void;
}

export function UserMessage({
  message,
  durationMs,
  canRewind,
  onEdit,
  onRetry,
}: UserMessageProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  const startEditing = () => setDraft(message.content);
  const cancelEditing = () => setDraft(null);

  const commit = () => {
    const trimmed = draft?.trim() ?? "";
    if (trimmed && trimmed !== message.content) onEdit(trimmed);
    setDraft(null);
  };

  if (editing) {
    return (
      <Stack gap="xs" w="100%" maw="80%" style={{ alignSelf: "flex-end" }}>
        <Textarea
          autosize
          autoFocus
          minRows={1}
          maxRows={8}
          value={draft ?? ""}
          aria-label="Edit message"
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") cancelEditing();
          }}
        />
        <Group justify="flex-end" gap="xs">
          <Button size="xs" variant="subtle" color="gray" onClick={cancelEditing}>
            Cancel
          </Button>
          <Button size="xs" onClick={commit} disabled={!draft.trim()}>
            Send
          </Button>
        </Group>
      </Stack>
    );
  }


  return (
    <>
      <MessageBubble message={message} />

      <Group justify="space-between" gap="xs" wrap="nowrap" align="center">
  <div>
    {durationMs !== undefined && (
      <RunStatusBanner isRunning={false} durationMs={durationMs} />
    )}
  </div>

    <Group gap={4} wrap="nowrap">
      <CopyButton value={message.content} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="top">
            <ActionIcon
              variant="subtle"
              color={copied ? "teal" : "gray"}
              size="sm"
              aria-label={copied ? "Copied to clipboard" : "Copy message"}
              onClick={copy}
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>

      {canRewind && (
        <>
          <Tooltip label="Edit" withArrow position="top">
            <ActionIcon
              variant="default"
              size="sm"
              aria-label="Edit message"
              onClick={startEditing}
            >
              <IconPencil size={14} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Try again" withArrow position="top">
            <ActionIcon
              variant="default"
              size="sm"
              aria-label="Retry this message"
              onClick={onRetry}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        </>
      )}
    </Group>
  </Group>
    </>
  );
}
