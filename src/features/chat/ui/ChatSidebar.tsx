"use client";

import { Button, ScrollArea, Skeleton, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import type { ChatRecord } from "../core";
import { ConversationItem } from "./ConversationItem";
import { groupChatsByDay } from "./util";

export interface ChatSidebarProps {
  chats: ChatRecord[];
  activeChatId: string;
  loading: boolean;
  isRunning: boolean;
  onNewConversation: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ChatSidebar({
  chats,
  activeChatId,
  loading,
  isRunning,
  onNewConversation,
  onSelect,
  onRename,
  onDelete
}: ChatSidebarProps) {
  const groups = groupChatsByDay(chats);
  const isDraft = !loading && !chats.some((chat) => chat.id === activeChatId);

  return (
    <Stack gap="md" flex={1} mih={0}>
      <Text fw={700} size="sm" lh={1.2}>
        GDC Query Augmented Generation (QAG)
      </Text>

      <Button
        leftSection={<IconPlus size={16} />}
        variant="filled"
        fullWidth
        onClick={onNewConversation}
        disabled={isRunning || isDraft}
      >
        New conversation
      </Button>


      <ScrollArea flex={1} mih={0} type="auto" offsetScrollbars>
        {loading ? (
          <Stack gap="xs">
            <Skeleton height={36} radius="sm" />
            <Skeleton height={36} radius="sm" />
            <Skeleton height={36} radius="sm" />
          </Stack>
        ) : (
          <Stack gap="md">
            {groups.map((group) => (
              <Stack gap="xs" key={group.label}>
                <Text size="xs" fw={700} c="dimmed" lts="1px">
                  {group.label}
                </Text>
                {group.chats.map((chat) => (
                  <ConversationItem
                    key={chat.id}
                    label={chat.title}
                    active={chat.id === activeChatId}
                    deleteDisabled={isRunning && chat.id === activeChatId}
                    onClick={() => onSelect(chat.id)}
                    onRename={(title) => onRename(chat.id, title)}
                    onDelete={() => onDelete(chat.id)}
                  />
                ))}
              </Stack>
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Stack>
  );
}
