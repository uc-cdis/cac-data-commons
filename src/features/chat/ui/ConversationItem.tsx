"use client";

import { useState } from "react";
import { ActionIcon, Group, Menu, Stack, Text, TextInput, UnstyledButton } from "@mantine/core";
import { IconDots, IconMessage, IconPencil, IconTrash } from "@tabler/icons-react";

export interface ConversationItemProps {
  label: string;
  hint?: string;
  active?: boolean;
  showActions?: boolean;
  deleteDisabled?: boolean;
  onClick?: () => void;
  onRename?: (title: string) => void;
  onDelete?: () => void;
}

export function ConversationItem({
  label,
  hint,
  active,
  showActions = true,
  deleteDisabled,
  onClick,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  const startEditing = () => setDraft(label);

  const commit = () => {
    const trimmed = draft?.trim() ?? "";
    if (trimmed && trimmed !== label) onRename?.(trimmed);
    setDraft(null);
  };

  return (
    <Group
      gap={4}
      wrap="nowrap"
      px="xs"
      py={6}
      style={{
        borderRadius: "var(--mantine-radius-sm)",
        backgroundColor: active ? "var(--mantine-color-body)" : "transparent",
        border: active
          ? "1px solid var(--mantine-color-default-border)"
          : "1px solid transparent",
      }}
    >
      {editing ? (
        <TextInput
          size="xs"
          autoFocus
          flex={1}
          data-keep-open
          value={draft}
          aria-label="Conversation title"
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") setDraft(null);
          }}
        />
      ) : (
        <>
          <UnstyledButton
            onClick={onClick}
            style={{ flex: 1, minWidth: 0, cursor: onClick ? "pointer" : "default" }}
          >
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <IconMessage
                size={16}
                color={active ? "var(--mantine-color-orange-6)" : "var(--mantine-color-dimmed)"}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                <Text size="sm" fw={active ? 600 : 500} truncate="end">
                  {label}
                </Text>
                {hint && (
                  <Text size="xs" c="dimmed" truncate="end">
                    {hint}
                  </Text>
                )}
              </Stack>
            </Group>
          </UnstyledButton>

          {showActions && (
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  data-keep-open
                  aria-label={`Actions for ${label}`}
                >
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconPencil size={14} />} onClick={startEditing}>
                  Rename
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  disabled={deleteDisabled}
                  onClick={onDelete}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </>
      )}
    </Group>
  );
}
