"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Collapse,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconPencil,
  IconRoute,
  IconX,
} from "@tabler/icons-react";
import type { ChatInterrupt, InterruptDecision, ToolCall } from "../../core";
import type { InterruptActions } from "./types";
import { resolveInterruptRenderer } from "./registry";
import { GenericInterruptBody } from "./GenericInterruptBody";

export interface InterruptCardProps {
  interrupt: ChatInterrupt;
  toolCall: ToolCall | null;
  actions: InterruptActions;
  /** Set once the agent has taken the answer. Collapses the card to a receipt. */
  decision?: InterruptDecision;
}

export function InterruptCard({
  interrupt,
  toolCall,
  actions,
  decision,
}: InterruptCardProps) {
  const { onApprove, onDeny, submitting } = actions;
  const entry = resolveInterruptRenderer(interrupt);
  const Body = entry?.Body ?? GenericInterruptBody;

  const [revision, setRevision] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const sendRevision = () => {
    const text = revision?.trim();
    if (text) onDeny(interrupt.id, text);
  };

  const body = <Body interrupt={interrupt} toolCall={toolCall} />;
  const summary = useMemo(
    () => entry?.summarize?.(interrupt) ?? toolCall?.name ?? "Approval",
    [entry, interrupt, toolCall],
  );

  if (decision) {
    return (
      <Paper withBorder radius="sm" p="sm" bg="var(--mantine-color-body)">
        <UnstyledButton
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          w="100%"
          display="block"
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <IconRoute size={16} color="var(--mantine-primary-color-light-color)" />
              <Text size="sm" fw={600}>
                {summary}
              </Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              {decision.approved ? (
                <Badge color="teal" variant="light" leftSection={<IconCheck size={12} />} />
              ) : decision.reason ? (
                <Badge color="orange" variant="light" leftSection={<IconPencil size={12} />} />
              ) : (
                <Badge color="red" variant="light" leftSection={<IconX size={12} />} />
              )}
              {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </Group>
          </Group>
        </UnstyledButton>
        <Collapse expanded={expanded}>
          <Stack gap="sm" pt="sm">
            {body}
            {!decision.approved && decision.reason && (
              <Text size="xs" c="dimmed">
                You asked for: {decision.reason}
              </Text>
            )}
          </Stack>
        </Collapse>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="sm" p="sm" bg="var(--mantine-color-body)">
      <Stack gap="sm">
        <Group gap="xs" wrap="nowrap">
          <IconRoute size={16} color="var(--mantine-primary-color-light-color)" />
          <Text size="sm" fw={600}>
            {summary}
          </Text>
        </Group>

        {body}

        {revision === null ? (
          <Group justify="flex-end" gap="xs">
            {/* Deny and Edit plan are hidden for now.
            <Button
              size="xs"
              variant="subtle"
              color="red"
              disabled={submitting}
              onClick={() => onDeny(interrupt.id)}
            >
              Deny
            </Button>
            <Button
              size="xs"
              variant="default"
              disabled={submitting}
              leftSection={<IconPencil size={14} />}
              onClick={() => setRevision("")}
            >
              Edit plan
            </Button>
            */}
            <Button size="xs" loading={submitting} onClick={() => onApprove(interrupt.id)}>
              Approve
            </Button>
          </Group>
        ) : (
          <Stack gap="xs">
            <Textarea
              autosize
              autoFocus
              minRows={2}
              maxRows={6}
              label="How should the agent change the plan?"
              description="The agent uses this to draft a revised plan."
              value={revision}
              disabled={submitting}
              onChange={(event) => setRevision(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendRevision();
                }
                if (event.key === "Escape") setRevision(null);
              }}
            />
            <Group justify="flex-end" gap="xs">
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                disabled={submitting}
                onClick={() => setRevision(null)}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                loading={submitting}
                disabled={!revision.trim()}
                onClick={sendRevision}
              >
                Send changes
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
