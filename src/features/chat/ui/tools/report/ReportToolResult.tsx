"use client";

import { useMemo } from "react";
import { Badge, Divider, Group, Paper, Text } from "@mantine/core";
import { IconReportAnalytics } from "@tabler/icons-react";
import type { ToolRendererProps } from "../types";
import { MarkdownContent } from "../../messages/MarkdownContent";
import { parseAgentReport } from "./parse";

/**
 * The agent's own write-up of how it answered - problem, evidence table,
 * conclusion - which otherwise sits in ToolCallPanel as a JSON blob.
 */
export function ReportToolResult({ result }: ToolRendererProps) {
  const parsed = useMemo(() => (result ? parseAgentReport(result) : null), [result]);

  if (!parsed?.ok) return null;

  const { answer, status } = parsed.data;

  return (
    <Paper withBorder radius="sm" p="sm" bg="var(--mantine-color-gray-light)">
      <Group gap="xs" mb="xs">
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
      <Divider mb="sm" />
      <MarkdownContent content={answer} />
    </Paper>
  );
}
