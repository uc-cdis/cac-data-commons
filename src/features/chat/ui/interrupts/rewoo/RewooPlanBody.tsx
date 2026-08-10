"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Code,
  Collapse,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { InterruptRendererProps } from "../types";
import { GenericInterruptBody } from "../GenericInterruptBody";
import { parseRewooPlan } from "./parse";

export function RewooPlanBody(props: InterruptRendererProps) {
  const { interrupt } = props;
  const parsed = useMemo(() => parseRewooPlan(interrupt.metadata), [interrupt.metadata]);
  const [showArgs, setShowArgs] = useState(false);


  if (!parsed.ok) return <GenericInterruptBody {...props} />;

  const { steps } = parsed.data;

  const argSteps = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => step.toolArguments != null);

  return (
    <Stack gap="sm">
      <Stack gap={0}>
        {steps.map((step, index) => {
          const last = index === steps.length - 1;
          return (
            <Group key={index} gap="sm" wrap="nowrap" align="stretch">
              <Stack gap={2} align="center" style={{ flexShrink: 0 }}>
                <ThemeIcon size={24} radius="xl" variant="filled">
                  <Text size="xs" fw={700}>
                    {index + 1}
                  </Text>
                </ThemeIcon>
                {!last && (
                  <Box flex={1} w={2} bg="var(--mantine-color-default-border)" />
                )}
              </Stack>

              <Stack gap={6} flex={1} pt={2} pb={last ? 0 : "md"} style={{ minWidth: 0 }}>
                <Text size="sm" lh={1.45}>
                  {step.plan}
                </Text>

                {(step.toolName || step.evidenceId) && (
                  <Group gap={6} wrap="wrap" align="center">
                    {step.toolName && (
                      <Code fz="xs">
                        {step.toolName}
                        {step.dependsOn.length > 0 && `(${step.dependsOn.join(", ")})`}
                      </Code>
                    )}
                    {step.evidenceId && (
                      <Tooltip
                        withArrow
                        label={`Later steps refer to this result as ${step.evidenceId}`}
                      >
                        <Badge
                          size="xs"
                          variant="light"
                          ff="monospace"
                          style={{ cursor: "help" }}
                        >
                          → {step.evidenceId}
                        </Badge>
                      </Tooltip>
                    )}
                  </Group>
                )}
              </Stack>
            </Group>
          );
        })}
      </Stack>

      {argSteps.length > 0 && (
        <>
          <UnstyledButton onClick={() => setShowArgs(!showArgs)} style={{ width: "fit-content" }}>
            <Group gap={6}>
              <Text size="xs" fw={700} c="dimmed">
                ARGUMENTS
              </Text>
              {showArgs ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            </Group>
          </UnstyledButton>

          <Collapse expanded={showArgs}>
            <Stack gap="xs">
              {argSteps.map(({ step, index }) => (
                <Stack key={index} gap={4}>
                  <Text size="xs" c="dimmed" ff="monospace">
                    {index + 1}. {step.toolName ?? step.plan}
                    {step.evidenceId && ` → ${step.evidenceId}`}
                  </Text>
                  <Code block>{JSON.stringify(step.toolArguments, null, 2)}</Code>
                </Stack>
              ))}
            </Stack>
          </Collapse>
        </>
      )}
    </Stack>
  );
}
