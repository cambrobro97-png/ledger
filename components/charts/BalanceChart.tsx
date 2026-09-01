"use client";

import { useMemo } from "react";
import { padSeries } from "@/lib/amortization";
import { addMonths, formatMonth, parseMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { useTweenedSeries } from "@/hooks/useTween";
import type { Amortization } from "@/lib/types";
import { ChartCard } from "./ChartCard";
import { ChartFrame, PayoffMarker } from "./ChartFrame";
import { useChartHover } from "./useChartHover";
import { LINE_PLOT, areaPath, linePath, niceMax } from "./geometry";

interface BalanceChartProps {
  baseline: Amortization;
  current: Amortization;
  /** Months the x-axis spans, always the do-nothing term. */
  length: number;
  startMonth: string;
  duration: number;
  className?: string;
}

const sampleAt = (series: number[], index: number) =>
  series[Math.min(index, series.length - 1)] ?? 0;

/** What you still owe, scenario against the do-nothing path. */
export function BalanceChart({
  baseline,
  current,
  length,
  startMonth,
  duration,
  className,
}: BalanceChartProps) {
  const start = parseMonth(startMonth);
  const baselineSeries = useMemo(
    () => padSeries(baseline.balances, length, 0),
    [baseline.balances, length],
  );
  const currentSeries = useMemo(
    () => padSeries(current.balances, length, 0),
    [current.balances, length],
  );

  const basePoints = useTweenedSeries(baselineSeries, duration);
  const linePoints = useTweenedSeries(currentSeries, duration);
  const max = niceMax(Math.max(baseline.balances[0], current.balances[0]));
  const { index, handlers } = useChartHover(LINE_PLOT, length);

  const readout =
    index === null ? (
      "\u00a0"
    ) : (
      <>
        <span>{formatMonth(addMonths(start, index))}</span>
        <span>
          this plan{" "}
          <strong style={{ color: "var(--jade)" }}>
            {formatMoney(sampleAt(current.balances, index))}
          </strong>
        </span>
        <span>
          no extra <strong>{formatMoney(sampleAt(baseline.balances, index))}</strong>
        </span>
      </>
    );

  return (
    <ChartCard
      className={className}
      title="What you still owe"
      hint="Hover the chart to read any year"
      readout={readout}
      legend={[
        { label: "This scenario", color: "var(--jade)" },
        { label: "No extra payments", dashed: true },
      ]}
    >
      <ChartFrame
        plot={LINE_PLOT}
        max={max}
        length={length}
        unitsPerYear={12}
        startYear={start.year}
        title="Remaining balance over time"
        {...handlers}
      >
        <defs>
          <linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--jade)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--jade)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <path
          d={linePath(LINE_PLOT, basePoints, max, length)}
          fill="none"
          stroke="var(--ash)"
          strokeWidth={2}
          strokeDasharray="6 6"
          opacity={0.75}
        />
        <path d={areaPath(LINE_PLOT, linePoints, max, length)} fill="url(#balance-fill)" />
        <path
          d={linePath(LINE_PLOT, linePoints, max, length)}
          fill="none"
          stroke="var(--jade)"
          strokeWidth={3}
          strokeLinejoin="round"
        />

        <PayoffMarker
          plot={LINE_PLOT}
          index={current.months}
          length={length}
          color="var(--jade)"
        />
      </ChartFrame>
    </ChartCard>
  );
}
