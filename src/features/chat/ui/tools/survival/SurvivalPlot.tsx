"use client";

import { memo, useMemo, type Key } from "react";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Paper, Text } from "@mantine/core";
import type { SurvivalCurve, SurvivalPoint } from "./parse";

// schemeCategory10, darkened to clear 4.5:1 contrast for normal text.
export const textColors = [
  "#1F77B4", "#BD5800", "#258825", "#D62728", "#8E5FB9",
  "#8C564B", "#D42BA1", "#757575", "#7A7A15", "#10828E",
];

export const MINIMUM_CASES = 10;
const DAYS_IN_MONTH = 30;
const CURVE_COLOR = textColors[0];
const DENSE_CURVE_CASES = 50;
const Y_TICKS_FINE = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const Y_TICKS_COARSE = [0, 0.2, 0.4, 0.6, 0.8, 1];

type Row = SurvivalPoint & { censoredEstimate: number | null };

function renderCensorTick(props: { cx?: number; cy?: number; key?: Key | null }) {
  const { cx, cy, key } = props;
  if (cx == null || cy == null) return <g key={key} />;
  return (
    <line
      key={key}
      x1={cx}
      x2={cx}
      y1={cy - 4}
      y2={cy + 4}
      stroke={CURVE_COLOR}
      strokeWidth={1.5}
    />
  );
}

function SurvivalTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point || !point.submitterId) return null;

  const months = Math.round(point.timeDays / DAYS_IN_MONTH);
  const years = Number(point.time.toFixed(1));
  const timeString = `${years} ${years === 1 ? "year" : "years"} (${months} ${
    months === 1 ? "month" : "months"
  })`;

  return (
    <Paper withBorder p="xs" radius="sm" shadow="md">
      <Text size="xs">
        <b>Case ID: </b>
        {`${point.projectId ?? "—"} / ${point.submitterId}`}
        <br />
        <b>Survival Rate: </b>
        {`${Math.round(point.estimate * 100)}%`}
        <br />
        <b>{point.censored ? "Interval of last follow-up: " : "Time of Death: "}</b>
        {timeString}
      </Text>
    </Paper>
  );
}

export const SurvivalPlot = memo(function SurvivalPlot({
  curve,
  height = 300,
}: {
  curve: SurvivalCurve;
  height?: number;
}) {
  const data = useMemo<Row[]>(
    () =>
      curve.points.map((p) => ({
        ...p,
        censoredEstimate: p.censored ? p.estimate : null,
      })),
    [curve],
  );

  const yTicks = curve.n >= DENSE_CURVE_CASES ? Y_TICKS_FINE : Y_TICKS_COARSE;

  return (
    <ResponsiveContainer width="100%" height={height} minWidth={320}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} horizontalValues={Y_TICKS_COARSE}/>
        <XAxis
          type="number"
          dataKey="time"
          domain={[0, curve.maxTime]}
          tickFormatter={(v: number) => v.toFixed(1)}
          height={48}
          tick={{ fontSize: 11 }}
        >
          <Label value="Duration (years)" position="insideBottom" offset={4} />
        </XAxis>
        <YAxis
          domain={[0, 1]}
          ticks={yTicks}
          tickFormatter={(v: number) => v.toFixed(1)}
          width={60}
          tick={{ fontSize: 11 }}
        >
          <Label value="Survival Rate" angle={-90} position="insideLeft" />
        </YAxis>
        <Tooltip content={<SurvivalTooltip />} />
        <Line
          type="stepAfter"
          dataKey="estimate"
          stroke={CURVE_COLOR}
          strokeWidth={2}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="censoredEstimate"
          stroke="none"
          dot={renderCensorTick}
          activeDot={false}
          isAnimationActive={false}
          legendType="none"
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
