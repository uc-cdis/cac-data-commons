"use client";

import {
  Badge,
  Code,
  Collapse,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconTool,
} from "@tabler/icons-react";
import type { ToolCall } from "../../core";
import { formatDuration, formatJson } from "../util";

export interface ToolCallPanelProps {
  toolCall: ToolCall;
  result: string | null;
  /** A call with no result is only pending while a run is in flight. */
  isRunning: boolean;
  /** This call is what an open approval is gating. */
  awaitingApproval?: boolean;
  durationMs?: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ToolCallPanel({
  toolCall,
  result,
  isRunning,
  awaitingApproval,
  durationMs,
  isExpanded,
  onToggle,
}: ToolCallPanelProps) {
  return (
   <Paper withBorder radius="sm" bg="var(--mantine-color-default)" style={{ overflow: "hidden" }}>
      <UnstyledButton
        onClick={onToggle}
        aria-expanded={isExpanded}
        w="100%"
        display="block"
      >
        <Group
          justify="space-between"
          p="xs"
          bg={isExpanded ? "var(--mantine-color-default-hover)" : "transparent"}
        >
          <Group gap="xs">
            <IconTool size={16} color="var(--mantine-color-gray-6)" />
            <Text size="sm" ff="monospace" fw={500}>
              {toolCall.name}
            </Text>
          </Group>

          <Group gap="sm">
            {durationMs !== undefined && (
              <Text size="xs" c="dimmed">
                {formatDuration(durationMs)}
              </Text>
            )}
            {awaitingApproval ? (
              null
            ) : result ? (
              <Badge color="teal" variant="light" leftSection={<IconCheck size={12} />}>
                Completed
              </Badge>
            ) : isRunning ? (
              <Badge color="blue" variant="light">
                <Loader size={10} type="dots" />
              </Badge>
            ) : (
              <Badge color="yellow" variant="light" leftSection={<IconAlertTriangle size={12} />}>
                No result
              </Badge>
            )}
            {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </Group>
        </Group>
      </UnstyledButton>

      <Collapse expanded={isExpanded}>
        <Stack
          p="sm"
          gap="xs"
          bg="var(--mantine-color-body)"
          bd="1px solid var(--mantine-color-default-border)"
          style={{ borderBottom: "none", borderLeft: "none", borderRight: "none" }}
        >
          <Text size="xs" fw={700} c="dimmed">
            PARAMETERS
          </Text>
          {toolCall.args ? (
            // Capped - one big payload would otherwise add thousands of pixels
            // to the conversation's scroll height.
            <Code block mah={300} style={{ overflow: "auto" }}>
              {JSON.stringify(toolCall.args, null, 2)}
            </Code>
          ) : (
            <Text size="xs" c="dimmed">
              Waiting for arguments…
            </Text>
          )}

          {result ? (
            <>
              <Text size="xs" fw={700} c="dimmed" mt="xs">
                RESULT
              </Text>
              <Code block mah={300} style={{ overflow: "auto" }}>
                {formatJson(result)}
              </Code>
            </>
          ) : awaitingApproval ? null : (
            !isRunning && (
              <Text size="xs" c="dimmed" mt="xs">
                The run ended without a result for this call.
              </Text>
            )
          )}
        </Stack>
      </Collapse>
    </Paper>
  );
}
