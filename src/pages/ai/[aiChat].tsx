import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  AppShell,
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
  Select,
  NavLink,
  Divider,
  Box,
  Table,
  Code,
  useMantineTheme,
  rem,
} from '@mantine/core';
import {
  IconSend,
  IconRobot,
  IconUser,
  IconPlus,
  IconPlayerStop,
  IconAlertCircle,
  IconMessage,
  IconTrash,
  IconBrain,
  IconTool,
  IconCheck,
} from '@tabler/icons-react';
import { useM3Chat, type ChatMessage } from '../../hooks/useM3Chat';
import { useDeepCompareCallback, useDeepCompareEffect } from 'use-deep-compare';
import { Response } from '@/components/ai/mantine';
import { ReasoningView } from '@/components/ai/mantine/ReasoningView';
import { ReasoningUIPart } from 'ai';

// ---------------------------------------------------------------------------
// Model options — update to match what copilot.m3aicommons.org accepts
// ---------------------------------------------------------------------------
export const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];
const DEFAULT_MODEL = MODEL_OPTIONS[0].value;

// ---------------------------------------------------------------------------
// Thread type
// ---------------------------------------------------------------------------
interface Thread {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
}

function newThread(model: string): Thread {
  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    messages: [],
    model,
    createdAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Markdown table parser → Mantine Table
// ---------------------------------------------------------------------------
interface ParsedTable {
  headers: string[];
  rows: string[][];
}

function parseMarkdownTable(block: string): ParsedTable | null {
  const lines = block
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 3) return null;
  // Must have a separator row (---|---|---)
  if (!/^\|?[\s\-:|]+\|/.test(lines[1])) return null;

  const parseRow = (line: string) =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);
  return { headers, rows };
}

function MarkdownTable({ table }: { table: ParsedTable }) {
  return (
    <Table
      striped
      highlightOnHover
      withTableBorder
      withColumnBorders
      fz="xs"
      my="xs"
      style={{ tableLayout: 'auto' }}
    >
      <Table.Thead>
        <Table.Tr>
          {table.headers.map((h, i) => (
            <Table.Th key={i} style={{ whiteSpace: 'nowrap' }}>
              {h}
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {table.rows.map((row, ri) => (
          <Table.Tr key={ri}>
            {row.map((cell, ci) => (
              <Table.Td key={ci}>{cell}</Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

// ---------------------------------------------------------------------------
// Rich text renderer — splits on markdown tables, renders the rest as text
// ---------------------------------------------------------------------------
function RichText({ content }: { content: string }) {
  // Split content into table blocks and text blocks
  const segments: Array<{ type: 'text' | 'table'; content: string }> = [];
  const tableRegex = /(\|.+\|[\s\S]*?\n\|[\s\-:|]+\|[\s\S]*?)(?=\n[^|]|\n$|$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }
    segments.push({ type: 'table', content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) });
  }
  if (segments.length === 0) segments.push({ type: 'text', content });

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'table') {
          const table = parseMarkdownTable(seg.content);
          if (table) return <MarkdownTable key={i} table={table} />;
        }
        return (
          <Text
            key={i}
            size="sm"
            style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
          >
            {seg.content}
          </Text>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// ToolCallBadge — shows tool name + state inline
// ---------------------------------------------------------------------------
interface ToolInvocationPart {
  type: 'tool-invocation';
  toolInvocation: {
    toolName: string;
    state:
      | 'input-streaming'
      | 'input-available'
      | 'output-available'
      | 'output-error';
    toolCallId: string;
    args?: unknown;
    output?: unknown;
  };
}

function ToolCallBadge({ part }: { part: ToolInvocationPart }) {
  const { toolName, state } = part.toolInvocation;
  const done = state === 'output-available' || state === 'output-error';
  const error = state === 'output-error';

  return (
    <Group gap={6} my={4}>
      <IconTool size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
      <Badge
        size="sm"
        variant={done ? 'light' : 'outline'}
        color={error ? 'red' : done ? 'teal' : 'blue'}
        leftSection={
          done ? <IconCheck size={10} /> : <Loader size={10} color="blue" />
        }
        style={{ fontFamily: 'monospace', textTransform: 'none' }}
      >
        {toolName}
        {done ? ' — done' : '…'}
      </Badge>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// MessageBubble — renders all part types from a UIMessage
// ---------------------------------------------------------------------------
interface UIMessagePart {
  type: string;
  text?: string;
  toolInvocation?: ToolInvocationPart['toolInvocation'];
}

function MessageBubble({
  role,
  parts,
  content,
}: {
  role: 'user' | 'assistant';
  parts?: UIMessagePart[];
  content: string;
}) {
  const theme = useMantineTheme();
  const isUser = role === 'user';

  // Render parts if present (AI SDK 5 format); fall back to plain content
  const body =
    parts && parts.length > 0 ? (
      <>
        {parts.map((part, i) => {
          if (part.type === 'step-start') {
            return (
              <Group key={i} gap={6} my={4}>
                <IconBrain size={13} style={{ opacity: 0.5 }} />
                <Text size="xs" c="dimmed" fs="italic">
                  Thinking…
                </Text>
              </Group>
            );
          }
         if ( part.type === 'reasoning' ) {
            return <ReasoningView part={part as ReasoningUIPart} key={i} />;
          }
          if (part.type === 'tool-invocation' && part.toolInvocation) {
            return (
              <ToolCallBadge
                key={i}
                part={{
                  type: 'tool-invocation',
                  toolInvocation: part.toolInvocation,
                }}
              />
            );
          }
          if (part.type === 'text' && part.text) {
            return (
              <Response key={i} mode="streaming">
                {part.text}
              </Response>
            );
          }
          return null;
        })}
      </>
    ) : (
      <Response mode="streaming">
        {content}
      </Response>
    );

  return (
    <Group
      align="flex-start"
      justify={isUser ? 'flex-end' : 'flex-start'}
      gap="xs"
      wrap="nowrap"
    >
      {!isUser && (
        <Avatar size="sm" color="blue" radius="xl" style={{ flexShrink: 0 }}>
          <IconRobot size={13} />
        </Avatar>
      )}
      <Paper
        shadow="xs"
        radius="lg"
        p="sm"
        maw="82%"
        style={{
          backgroundColor: isUser ? theme.colors.blue[6] : theme.colors.gray[0],
          color: isUser ? theme.white : undefined,
          borderBottomRightRadius: isUser ? 4 : undefined,
          borderBottomLeftRadius: !isUser ? 4 : undefined,
          overflow: 'auto',
        }}
      >
        {body}
      </Paper>
      {isUser && (
        <Avatar size="sm" color="gray" radius="xl" style={{ flexShrink: 0 }}>
          <IconUser size={13} />
        </Avatar>
      )}
    </Group>
  );
}

// ---------------------------------------------------------------------------
// ActiveChat — right panel, keyed per thread
// ---------------------------------------------------------------------------
interface ActiveChatProps {
  thread: Thread;
  model: string;
  apiUrl?: string;
  extraBody?: Record<string, unknown>;
  onMessagesChange: (
    threadId: string,
    messages: ChatMessage[],
    title: string,
  ) => void;
}

function ActiveChat({
  thread,
  model,
  apiUrl,
  extraBody,
  onMessagesChange,
}: ActiveChatProps) {
  const {
    messages,
    rawMessages,
    isLoading,
    streamingContent,
    sendMessage,
    stop,
    error,
  } = useM3Chat({
    apiUrl,
    initialMessages: thread.messages,
    body: { model, ...extraBody },
  });

  const [input, setInput] = useState('');
  const viewport = useRef<HTMLDivElement>(null);

  useDeepCompareEffect(() => {
    if (messages.length === 0) return;
    const firstUser = messages.find((m) => m.role === 'user');
    const title = firstUser
      ? firstUser.content.slice(0, 42) +
        (firstUser.content.length > 42 ? '…' : '')
      : thread.title;
    onMessagesChange(thread.id, messages, title);
  }, [messages, thread.title, thread.id, onMessagesChange]);

  useDeepCompareEffect(() => {
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
    <Stack gap="xs" h="100%" style={{ overflow: 'hidden' }}>
      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>

      {error && (
        <Alert
          icon={<IconAlertCircle size={14} />}
          color="red"
          variant="light"
          radius="md"
          py={6}
        >
          <Text size="xs">{error.message}</Text>
        </Alert>
      )}

      <ScrollArea
        flex={1}
        viewportRef={viewport}
        styles={{ viewport: { paddingInline: 8 } }}
      >
        <Stack gap="md" py="sm">
          {rawMessages.length === 0 && !isLoading && (
            <Text c="dimmed" size="sm" ta="center" mt={rem(60)}>
              Start a conversation.
            </Text>
          )}
          {rawMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role as 'user' | 'assistant'}
              parts={(msg as any).parts}
             content={""}
            />
          ))}

          {/* Streaming in-progress bubble */}
          {isLoading && (
            <Group align="flex-start" gap="xs">
              <Avatar
                size="sm"
                color="blue"
                radius="xl"
                style={{ flexShrink: 0 }}
              >
                <IconRobot size={13} />
              </Avatar>
              <Paper
                shadow="xs"
                radius="lg"
                p="sm"
                style={{
                  borderBottomLeftRadius: 4,
                  backgroundColor: 'var(--mantine-color-gray-0)',
                }}
              >
                {streamingContent ? (
                  <Text
                    size="sm"
                    style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                  >
                    {streamingContent}
                    <Box
                      component="span"
                      style={{
                        display: 'inline-block',
                        width: 6,
                        height: 14,
                        backgroundColor: 'var(--mantine-color-blue-4)',
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
          )}
        </Stack>
      </ScrollArea>

      <Paper withBorder radius="md" p={4} style={{ flexShrink: 0 }}>
        <Group gap={4} align="flex-end" wrap="nowrap">
          <Textarea
            flex={1}
            variant="unstyled"
            placeholder="Send a message…"
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            autosize
            minRows={1}
            maxRows={6}
            disabled={isLoading}
            styles={{ input: { paddingLeft: 8 } }}
          />
          {isLoading ? (
            <Tooltip label="Stop">
              <ActionIcon
                size="lg"
                variant="filled"
                color="red"
                radius="md"
                onClick={stop}
                mb={2}
                mr={2}
              >
                <IconPlayerStop size={16} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <ActionIcon
              size="lg"
              variant="filled"
              color="blue"
              radius="md"
              onClick={handleSend}
              disabled={!input.trim()}
              mb={2}
              mr={2}
            >
              <IconSend size={16} />
            </ActionIcon>
          )}
        </Group>
        <Text c="dimmed" size="10px" ta="right" pr={6} pb={2}>
          <Kbd size="xs">Enter</Kbd> send · <Kbd size="xs">Shift+Enter</Kbd>{' '}
          newline
        </Text>
      </Paper>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// M3ChatShell
// ---------------------------------------------------------------------------
export interface M3ChatShellProps {
  apiUrl?: string;
  extraBody?: Record<string, unknown>;
}

export function M3ChatShell({ apiUrl, extraBody }: M3ChatShellProps) {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [threads, setThreads] = useState<Thread[]>(() => [
    newThread(DEFAULT_MODEL),
  ]);
  const [activeId, setActiveId] = useState<string>(threads[0].id);

  const activeThread = threads.find((t) => t.id === activeId) ?? threads[0];

  const handleNew = useDeepCompareCallback(() => {
    const t = newThread(model);
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
  }, [model]);

  const handleDelete = useDeepCompareCallback(
    (id: string) => {
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) {
          const t = newThread(model);
          setActiveId(t.id);
          return [t];
        }
        if (id === activeId) setActiveId(next[0].id);
        return next;
      });
    },
    [activeId, model],
  );

  const handleMessagesChange = useDeepCompareCallback(
    (threadId: string, messages: ChatMessage[], title: string) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, messages, title } : t)),
      );
    },
    [],
  );

  return (
    <AppShell
      navbar={{ width: 260, breakpoint: 'sm' }}
      padding={0}
      styles={{
        main: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      {/* ── Sidebar ───────────────────────────────────────── */}
      <AppShell.Navbar
        p="xs"
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <Group justify="space-between" px={4} pt={4} pb={2}>
          <Group gap={6}>
            <IconRobot size={16} />
            <Text fw={700} size="sm">
              M3 AI Chat
            </Text>
          </Group>
          <Tooltip label="New chat">
            <ActionIcon size="sm" variant="light" onClick={handleNew}>
              <IconPlus size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        <Select
          size="xs"
          label="Model"
          data={MODEL_OPTIONS}
          value={model}
          onChange={(v) => setModel(v ?? DEFAULT_MODEL)}
          allowDeselect={false}
          styles={{
            label: {
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
          }}
        />

        <Divider />

        <ScrollArea flex={1} offsetScrollbars>
          <Stack gap={2}>
            {threads.map((t) => (
              <NavLink
                key={t.id}
                active={t.id === activeId}
                label={
                  <Text size="xs" truncate="end" style={{ maxWidth: 170 }}>
                    {t.title}
                  </Text>
                }
                leftSection={<IconMessage size={13} />}
                rightSection={
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                    style={{ opacity: 0.4 }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.opacity = '0.4')
                    }
                  >
                    <IconTrash size={11} />
                  </ActionIcon>
                }
                onClick={() => setActiveId(t.id)}
                style={{ borderRadius: 6 }}
              />
            ))}
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      {/* ── Main panel ────────────────────────────────────── */}
      <AppShell.Main
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Group
          px="md"
          py="xs"
          style={{
            borderBottom: '1px solid var(--mantine-color-default-border)',
            flexShrink: 0,
          }}
          justify="space-between"
        >
          <Text fw={600} size="sm" truncate style={{ maxWidth: 400 }}>
            {activeThread.title}
          </Text>
          <Badge size="xs" variant="light" color="blue">
            {MODEL_OPTIONS.find((m) => m.value === model)?.label ?? model}
          </Badge>
        </Group>

        <Box
          flex={1}
          p="md"
          style={{
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ActiveChat
            key={activeThread.id}
            thread={activeThread}
            model={model}
            apiUrl={apiUrl}
            extraBody={extraBody}
            onMessagesChange={handleMessagesChange}
          />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

M3ChatShell.whyDidYouRender = true;

export default M3ChatShell;
