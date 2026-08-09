"use client";

import { useMemo } from "react";
import { Paper, Skeleton, Text, Tooltip } from "@mantine/core";
import type { ToolRendererProps } from "../types";
import { parseSurvivalResult } from "./parse";
import { MINIMUM_CASES, SurvivalPlot } from "./SurvivalPlot";

const HEIGHT = 300;

export function SurvivalToolResult({ result }: ToolRendererProps) {
  const parsed = useMemo(
    () => (result ? parseSurvivalResult(result) : null),
    [result],
  );

  if (!parsed) return <Skeleton height={HEIGHT} radius="sm" />;

  if (!parsed.ok) {
    return (
      <Text size="sm" c="dimmed">
        Couldn&apos;t read the survival data ({parsed.reason}).
      </Text>
    );
  }

  const { curves, pValue } = parsed.data;

  // Matches GDC's enoughData(): every curve must clear MINIMUM_CASES.
  if (curves.length === 0 || curves.some((c) => c.n < MINIMUM_CASES)) {
  return (
    <Paper withBorder radius="sm" p="sm" bg="var(--mantine-color-body)">
      <Text size="sm" c="dimmed">Not enough survival data.</Text>
    </Paper>
  );
}

  const curve = curves[0];

  return (
   <Paper withBorder radius="sm" p="sm" bg="var(--mantine-color-body)">
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
    </Paper>
  );
}
