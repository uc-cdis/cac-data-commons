"use client";

import { Stack, Text, Title, UnstyledButton, Group } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";

const EXAMPLE_QUESTIONS = [
  "What is the prevalence of BRAF SSMs in lung cancer?",
  "What is the average gene expression for TP53 and MUC16 in cases with lung adenocarcinoma?",
  "What is the average gene expression of BRAF in TCGA-BRCA?",
  "List the most variably expressed genes in APOLLO-LUAD.",
  "Compare the expression of TP53, MUC16, and BRAF in APOLLO-LUAD.",
] as const;

export interface EmptyStateProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function EmptyState({ onSelect, disabled }: EmptyStateProps) {
  // Width and gutter come from the conversation column this renders into.
  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Title order={1} c="blue.9">
          Ask GDC About Cancer Data
        </Title>
        <Text size="lg" textWrap="wrap">
          Use GDC Query Augmented Generation (QAG) to ask questions about
          harmonized cancer datasets, clinical progression, and therapy response.
        </Text>
      </Stack>

      <Stack gap="xs">
        <Text size="xs" fw={700} c="blue.9" lts="1px">
          EXAMPLE QUESTIONS
        </Text>
        {EXAMPLE_QUESTIONS.map((q) => (
          <UnstyledButton
            key={q}
            onClick={() => !disabled && onSelect(q)}
            disabled={disabled}
            p="md"
            style={{
              borderRadius: "var(--mantine-radius-sm)",
              border: "1px solid var(--mantine-color-default-border)",
              backgroundColor: "var(--mantine-color-default)",
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" textWrap="wrap">
                {q}
              </Text>
              <IconArrowRight
                size={18}
                color="var(--mantine-color-orange-6)"
                style={{ flexShrink: 0 }}
              />
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Stack>
  );
}
