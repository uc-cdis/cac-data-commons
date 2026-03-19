"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Stack,
  Group,
  Text,
  Textarea,
  ActionIcon,
  ScrollArea,
  Paper,
  Avatar,
  Badge,
  Loader,
  Kbd,
  useMantineTheme,
} from "@mantine/core";
import { IconSend, IconRobot, IconUser } from "@tabler/icons-react";
import { useAgentChatCoPilot, type UseAgentChatOptions } from "../../hooks/useAgentChatCoPilot";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const theme = useMantineTheme();
  const isUser = role === "user";

  return (
    <Group
      align="flex-start"
      justify={isUser ? "flex-end" : "flex-start"}
      gap="sm"
      wrap="nowrap"
    >
      {!isUser && (
        <Avatar size="sm" color="blue" radius="xl">
          <IconRobot size={14} />
        </Avatar>
      )}

      <Paper
        shadow="xs"
        radius="lg"
        p="sm"
        maw="75%"
        style={{
          backgroundColor: isUser
            ? theme.colors.blue[6]
            : theme.colors.gray[0],
          color: isUser ? theme.white : theme.colors.dark[7],
          borderBottomRightRadius: isUser ? 4 : undefined,
          borderBottomLeftRadius: !isUser ? 4 : undefined,
        }}
      >
        <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {content}
          {isStreaming && (
            <Box
              component="span"
              ml={4}
              style={{ display: "inline-block", verticalAlign: "middle" }}
            >
              <Loader size={10} color={isUser ? "white" : "blue"} />
            </Box>
          )}
        </Text>
      </Paper>

      {isUser && (
        <Avatar size="sm" color="gray" radius="xl">
          <IconUser size={14} />
        </Avatar>
      )}
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface AgentChatProps extends UseAgentChatOptions {
  /** Placeholder shown in the input */
  placeholder?: string;
  /** Height of the scrollable message area */
  chatHeight?: number | string;
  /** Show the agent state panel (useful during dev) */
  showStatePanel?: boolean;
}

export function AgentChat({
                            agentName,
                            initialAgentState,
                            placeholder = "Send a message…",
                            chatHeight = 480,
                            showStatePanel = false,
                          }: AgentChatProps) {
  const { messages, isLoading, sendMessage, agentState } = useAgentChatCoPilot({
    agentName,
    initialAgentState,
  });

  const [input, setInput] = useState("");
  const viewport = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    viewport.current?.scrollTo({
      top: viewport.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Stack gap="xs" h="100%">
      {/* Header */}
      <Group justify="space-between" px="xs">
        <Group gap="xs">
          <IconRobot size={18} />
          <Text fw={600} size="sm">
            {agentName ?? "Assistant"}
          </Text>
        </Group>
        {isLoading && (
          <Badge size="xs" color="blue" variant="dot">
            Thinking…
          </Badge>
        )}
      </Group>

      {/* Message scroll area */}
      <ScrollArea
        h={chatHeight}
        viewportRef={viewport}
        styles={{ viewport: { padding: "0 8px" } }}
      >
        <Stack gap="md" py="sm">
          {messages.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" mt="xl">
              No messages yet. Start the conversation!
            </Text>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={msg.isStreaming}
            />
          ))}
          {isLoading && messages.at(-1)?.role === "user" && (
            <Group gap="sm">
              <Avatar size="sm" color="blue" radius="xl">
                <IconRobot size={14} />
              </Avatar>
              <Paper shadow="xs" radius="lg" p="sm">
                <Loader size="xs" type="dots" />
              </Paper>
            </Group>
          )}
        </Stack>
      </ScrollArea>

      {/* Input row */}
      <Paper withBorder radius="md" p={4}>
        <Group gap={4} align="flex-end" wrap="nowrap">
          <Textarea
            flex={1}
            variant="unstyled"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            autosize
            minRows={1}
            maxRows={6}
            disabled={isLoading}
            styles={{ input: { paddingLeft: 8 } }}
          />
          <ActionIcon
            size="lg"
            variant="filled"
            color="blue"
            radius="md"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            mb={2}
            mr={2}
          >
            <IconSend size={16} />
          </ActionIcon>
        </Group>
        <Text c="dimmed" size="10px" ta="right" pr={6} pb={2}>
          <Kbd size="xs">Enter</Kbd> to send · <Kbd size="xs">Shift+Enter</Kbd>{" "}
          for newline
        </Text>
      </Paper>

      {/* Dev: agent state panel */}
      {showStatePanel && (
        <Paper withBorder p="xs" radius="md">
          <Text size="xs" fw={600} c="dimmed" mb={4}>
            Agent State
          </Text>
          <Text size="xs" ff="monospace" style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(agentState, null, 2)}
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
