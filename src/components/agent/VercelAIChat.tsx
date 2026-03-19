'use client';

/**
 * M3Chat.tsx
 *
 * Mantine chat component wired directly to the M3 AI Commons
 * Vercel AI SDK endpoint. No CopilotKit dependency.
 *
 * Usage:
 *   <M3Chat />
 *
 * Or with context body fields forwarded to the API:
 *   <M3Chat body={{ dataset: "MMRF", filters: activeFilters }} />
 */

import React, { useEffect, useRef, useState } from 'react';
import {
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
  Alert,
  Tooltip,
  useMantineTheme,
  Box,
} from '@mantine/core';
import {
  IconSend,
  IconRobot,
  IconUser,
  IconRefresh,
  IconPlayerStop,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  useAgentChatVercelAI,
  type UseVercelAIChatOptions,
} from '../../hooks/useAgentChatVercelAI';

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

function MessageBubble({ role, content }: MessageBubbleProps) {
  const theme = useMantineTheme();
  const isUser = role === 'user';

  return (
    <Group
      align="flex-start"
      justify={isUser ? 'flex-end' : 'flex-start'}
      gap="sm"
      wrap="nowrap"
    >
      {!isUser && (
        <Avatar size="sm" color="blue" radius="xl" style={{ flexShrink: 0 }}>
          <IconRobot size={14} />
        </Avatar>
      )}

      <Paper
        shadow="xs"
        radius="lg"
        p="sm"
        maw="78%"
        style={{
          backgroundColor: isUser
            ? theme.colors.blue[6]
              : theme.colors.gray[0],
          color: isUser ? theme.white : undefined,
          borderBottomRightRadius: isUser ? 4 : undefined,
          borderBottomLeftRadius: !isUser ? 4 : undefined,
        }}
      >
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {content}
        </Text>
      </Paper>

      {isUser && (
        <Avatar size="sm" color="gray" radius="xl" style={{ flexShrink: 0 }}>
          <IconUser size={14} />
        </Avatar>
      )}
    </Group>
  );
}

// ---------------------------------------------------------------------------
// StreamingBubble — shown while assistant is typing
// ---------------------------------------------------------------------------

function StreamingBubble({ content }: { content: string }) {
  const theme = useMantineTheme();

  return (
    <Group align="flex-start" gap="sm" wrap="nowrap">
      <Avatar size="sm" color="blue" radius="xl" style={{ flexShrink: 0 }}>
        <IconRobot size={14} />
      </Avatar>
      <Paper
        shadow="xs"
        radius="lg"
        p="sm"
        maw="78%"
        style={{
          backgroundColor:theme.colors.gray[0],
          borderBottomLeftRadius: 4,
        }}
      >
        {content ? (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {content}
            <Box
              component="span"
              style={{
                display: 'inline-block',
                width: 6,
                height: 14,
                backgroundColor: theme.colors.blue[4],
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite',
              }}
            />
          </Text>
        ) : (
          <Loader size="xs" type="dots" />
        )}
      </Paper>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// M3Chat
// ---------------------------------------------------------------------------

export interface M3ChatProps extends UseVercelAIChatOptions {
  placeholder?: string;
  chatHeight?: number | string;
  /** Title shown in the header */
  title?: string;
}

export function VercelAIChat({
  apiUrl,
  initialMessages,
  body,
  onError,
  placeholder = 'Ask about the dataset…',
  chatHeight = 480,
  title = 'M3 AI Assistant',
}: M3ChatProps) {
  const {
    messages,
    isLoading,
    streamingContent,
    sendMessage,
    reset,
    stop,
    error,
  } = useAgentChatVercelAI({ apiUrl, initialMessages, body, onError });

  const [input, setInput] = useState('');
  const viewport = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    viewport.current?.scrollTo({
      top: viewport.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, streamingContent]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Blinking cursor keyframe — inject once */}
      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>

      <Stack gap="xs" h="100%">
        {/* ── Header ──────────────────────────────────── */}
        <Group justify="space-between" px="xs" pt={2}>
          <Group gap="xs">
            <IconRobot size={16} />
            <Text fw={600} size="sm">
              {title}
            </Text>
          </Group>
          <Group gap={6}>
            {isLoading && (
              <>
                <Badge size="xs" color="blue" variant="dot">
                  Streaming…
                </Badge>
                <Tooltip label="Stop generation">
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={stop}
                  >
                    <IconPlayerStop size={12} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
            <Tooltip label="Clear conversation">
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={reset}
                disabled={isLoading || messages.length === 0}
              >
                <IconRefresh size={12} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* ── Error banner ────────────────────────────── */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={14} />}
            color="red"
            variant="light"
            title="Request failed"
            radius="md"
            py={6}
          >
            <Text size="xs">{error.message}</Text>
          </Alert>
        )}

        {/* ── Message list ────────────────────────────── */}
        <ScrollArea
          h={chatHeight}
          viewportRef={viewport}
          styles={{ viewport: { paddingInline: 8 } }}
        >
          <Stack gap="md" py="sm">
            {messages.length === 0 && !isLoading && (
              <Text c="dimmed" size="sm" ta="center" mt="xl">
                Ask anything about the dataset.
              </Text>
            )}

            {/* Settled messages */}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
              />
            ))}

            {/* Streaming in-progress */}
            {isLoading && <StreamingBubble content={streamingContent} />}
          </Stack>
        </ScrollArea>

        {/* ── Input ───────────────────────────────────── */}
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
            <Kbd size="xs">Enter</Kbd> send · <Kbd size="xs">Shift+Enter</Kbd>{' '}
            newline
          </Text>
        </Paper>
      </Stack>
    </>
  );
}
