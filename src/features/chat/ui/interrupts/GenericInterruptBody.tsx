"use client";

import { useState } from "react";
import { Code, Collapse, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { InterruptRendererProps } from "./types";

/**
 * Fallback for an unregistered approval kind. Not a placeholder - it renders the
 * agent's own `message`, so an unknown kind stays decidable.
 */
export function GenericInterruptBody({ interrupt, toolCall }: InterruptRendererProps) {
  const [showArgs, setShowArgs] = useState(false);

  return (
    <Stack gap="xs">
      <Text size="sm" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {interrupt.message ?? "The agent is waiting for your approval to continue."}
      </Text>

      {toolCall && (
        <>
          <UnstyledButton
            onClick={() => setShowArgs(!showArgs)}
            aria-expanded={showArgs}
            w="fit-content"
          >
            <Group gap="xs">
              <Text size="xs" fw={700} c="dimmed">
                PARAMETERS
              </Text>
              <Text size="xs" ff="monospace" c="dimmed">
                {toolCall.name}
              </Text>
              {showArgs ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            </Group>
          </UnstyledButton>

          <Collapse expanded={showArgs}>
            {toolCall.args ? (
              <Code block>{JSON.stringify(toolCall.args, null, 2)}</Code>
            ) : (
              <Text size="xs" c="dimmed">
                Arguments never finished streaming.
              </Text>
            )}
          </Collapse>
        </>
      )}
    </Stack>
  );
}
