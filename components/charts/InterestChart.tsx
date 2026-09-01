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
import { LINE_PLOT, betweenPath, linePath, niceMax } from "./geometry";

interface InterestChartProps {
  baseline: Amortization;
  current: Amortization;
  length: number;
  startMonth: string;
  duration: number;
  className?: string;
}

const sampleAt = (series: number[], index: number) =>
  series[Math.min(index, series.length - 1)] ?? 0;

/** Cumulative interest, with the gap to the baseline shaded as money kept. */
export function InterestChart({
  baseline,
  current,
  length,
  startMonth,
  duration,
  className,
}: InterestChartProps) {
  const start = parseMonth(startMonth);
  const baselineSeries = useMemo(
    () => padSeries(baseline.cumulativeInterest, length),
    [baseline.cumulativeInterest, length],
  );
  const currentSeries = useMemo(
    () => padSeries(current.cumulativeInterest, length),
    [current.cumulativeInterest, length],
  );

  const basePoints = useTweenedSeries(baselineSeries, duration);
  const linePoints = useTweenedSeries(currentSeries, duration);
  const max = niceMax(baseline.totalInterest);
  const { index, handlers } = useChartHover(LINE_PLOT, length);

  const readout =
    index === null ? (
      "\u00a0"
    ) : (
      <>
        <span>{formatMonth(addMonths(start, index))}</span>
        <span>
          this plan{" "}
          <strong style={{ color: "var(--crimson)" }}>
            {formatMoney(sampleAt(current.cumulativeInterest, index))}
          </strong>
        </span>
        <span>
          avoided{" "}
          <strong style={{ color: "var(--brass)" }}>
            {formatMoney(
              sampleAt(baseline.cumulativeInterest, index) -
                sampleAt(current.cumulativeInterest, index),
            )}
          </strong>
        </span>
      </>
    );

  return (
    <ChartCard
      className={className}
      title="Interest handed to the bank"
      hint="Cumulative, from today forward"
      readout={readout}
      legend={[
        { label: "Interest paid", color: "var(--crimson)" },
        { label: "No extra payments", dashed: true },
        { label: "Interest avoided", color: "rgba(232, 177, 76, 0.45)" },
      ]}
    >
      <ChartFrame
        plot={LINE_PLOT}
        max={max}
        length={length}
        unitsPerYear={12}
        startYear={start.year}
        title="Cumulative interest paid over time"
        {...handlers}
      >
        <path
          d={betweenPath(LINE_PLOT, basePoints, linePoints, max, length)}
          fill="rgba(232, 177, 76, 0.16)"
        />
        <path
          d={linePath(LINE_PLOT, basePoints, max, length)}
          fill="none"
          stroke="var(--ash)"
          strokeWidth={2}
          strokeDasharray="6 6"
          opacity={0.75}
        />
        <path
          d={linePath(LINE_PLOT, linePoints, max, length)}
          fill="none"
          stroke="var(--crimson)"
          strokeWidth={3}
          strokeLinejoin="round"
        />

        <PayoffMarker
          plot={LINE_PLOT}
          index={current.months}
          length={length}
          color="var(--crimson)"
        />
      </ChartFrame>
    </ChartCard>
  );
}
