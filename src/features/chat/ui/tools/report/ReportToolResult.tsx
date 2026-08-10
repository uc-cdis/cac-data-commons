"use client";

import { memo, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Collapse,
  Divider,
  Group,
  Paper,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconReportAnalytics,
} from "@tabler/icons-react";
import type { ToolRendererProps } from "../types";
import { MarkdownContent } from "../../messages/MarkdownContent";
import { parseAgentReport } from "./parse";

/**
 * The agent's own write-up of how it answered - problem, evidence table,
 * conclusion - which otherwise sits in ToolCallPanel as a JSON blob.
 *
 * Collapsed by default: it restates most of the answer that now renders below it, so
 * left open it pushes the actual answer off screen.
 */
function ReportToolResultImpl({ result }: ToolRendererProps) {
  const parsed = useMemo(() => (result ? parseAgentReport(result) : null), [result]);
  const [expanded, setExpanded] = useState(false);

  if (!parsed?.ok) return null;

  const { answer, status } = parsed.data;

  return (
    <Paper
      withBorder
      radius="sm"
      bg="var(--mantine-color-gray-light)"
      style={{ overflow: "hidden" }}
    >
      <UnstyledButton
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        w="100%"
        display="block"
        p="sm"
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <IconReportAnalytics size={16} color="var(--mantine-color-teal-light-color)" />
            <Text size="sm" fw={700}>
              Run Summary
            </Text>
            {status && status !== "SOLVED" && (
              <Badge size="xs" color="yellow" variant="light">
                {status}
              </Badge>
            )}
          </Group>
          {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </Group>
      </UnstyledButton>

      <Collapse expanded={expanded} keepMounted={false}>
        <Box px="sm" pb="sm">
          <Divider mb="sm" />
          <MarkdownContent content={answer} />
        </Box>
      </Collapse>
    </Paper>
  );
}

export const ReportToolResult = memo(
  ReportToolResultImpl,
  (a, b) => a.result === b.result && a.toolCall.id === b.toolCall.id,
);
