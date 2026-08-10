"use client";

import { memo, useMemo } from "react";
import { Divider, Group, Paper, Skeleton, Text, Tooltip } from "@mantine/core";
import type { ToolRendererProps } from "../types";
import { readPayloadRef, type SummaryStat } from "../payload";
import { usePayload } from "../usePayload";
import type { SurvivalData } from "./parse";
import { parseSurvivalResult } from "./parse";
import { MINIMUM_CASES, SurvivalPlot } from "./SurvivalPlot";

const HEIGHT = 300;

function SummaryStrip({ stats }: { stats: SummaryStat[] }) {
  if (stats.length === 0) return null;

  return (
    <Group gap="xl" wrap="wrap">
      {stats.map((stat, i) => (
        // Labels come from the agent and could repeat, so the index keeps the key unique.
        <div key={`${stat.label}-${i}`}>
          <Text size="xs" c="dimmed" tt="uppercase">
            {stat.label}
          </Text>
          <Text size="lg" fw={700}>
            {`${(stat.value * 100).toFixed(1)}%`}
          </Text>
        </div>
      ))}
    </Group>
  );
}

function SurvivalBody({ data }: { data: SurvivalData }) {
  const { curves, pValue } = data;

  // Matches GDC's enoughData(): every curve must clear MINIMUM_CASES.
  if (curves.length === 0 || curves.some((c) => c.n < MINIMUM_CASES)) {
    return (
      <Text size="sm" c="dimmed">
        Not enough survival data.
      </Text>
    );
  }

  const curve = curves[0];

  return (
    <>
      <Text size="sm">
        <b>{curve.n.toLocaleString()}</b> Cases with Survival Data
      </Text>
      {pValue !== undefined && (
        <Tooltip
          disabled={pValue !== 0}
          label="Value shows 0.00e+0 because the P-Value is extremely low and goes beyond the precision inherent in the code."
        >
          <Text size="xs" c="dimmed">
            Log-Rank Test P-Value = {pValue.toExponential(2)}
          </Text>
        </Tooltip>
      )}
      <SurvivalPlot curve={curve} height={HEIGHT} />
    </>
  );
}


function SurvivalToolResultImpl({ result }: ToolRendererProps) {
  const ref = useMemo(() => (result ? readPayloadRef(result) : null), [result]);
  // Unconditional: a null id just idles the hook.
  const { data, loading, error } = usePayload(ref?.payloadId ?? null);
  const parsed = useMemo(() => (data ? parseSurvivalResult(data) : null), [data]);

  if (!result) return <Skeleton height={HEIGHT} radius="sm" />;

  if (!ref) {
    return (
      <Text size="sm" c="dimmed">
        Couldn&apos;t read the survival result.
      </Text>
    );
  }

  return (
    <Paper withBorder radius="sm" p="sm" bg="var(--mantine-color-body)">
      <SummaryStrip stats={ref.summary} />

      {loading && <Skeleton height={HEIGHT} radius="sm" mt="sm" />}

      {error && (
        <Text size="xs" c="dimmed" mt="xs">
          {error}
        </Text>
      )}

      {parsed && !parsed.ok && (
        <Text size="xs" c="dimmed" mt="xs">
          Couldn&apos;t read the full curve ({parsed.reason}).
        </Text>
      )}

      {parsed?.ok && (
        <>
          <Divider my="sm" />
          <SurvivalBody data={parsed.data} />
        </>
      )}
    </Paper>
  );
}

export const SurvivalToolResult = memo(
  SurvivalToolResultImpl,
  (a, b) => a.result === b.result && a.toolCall.id === b.toolCall.id,
);
