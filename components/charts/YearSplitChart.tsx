"use client";

import { useMemo } from "react";
import { padYears } from "@/lib/amortization";
import { parseMonth } from "@/lib/dates";
import { useTweenedSeries } from "@/hooks/useTween";
import type { Amortization } from "@/lib/types";
import { ChartCard } from "./ChartCard";
import { ChartFrame } from "./ChartFrame";
import { BAR_PLOT, innerHeight, innerWidth, niceMax } from "./geometry";

interface YearSplitChartProps {
  current: Amortization;
  /** Months the do-nothing term runs, so the bar count stays stable. */
  length: number;
  startMonth: string;
  duration: number;
  className?: string;
}

/** Yearly stack of interest against principal: the crossover is the whole point. */
export function YearSplitChart({
  current,
  length,
  startMonth,
  duration,
  className,
}: YearSplitChartProps) {
  const start = parseMonth(startMonth);
  const years = Math.ceil(length / 12);

  const interestTarget = useMemo(
    () => padYears(current.interestByYear, years),
    [current.interestByYear, years],
  );
  const principalTarget = useMemo(
    () => padYears(current.principalByYear, years),
    [current.principalByYear, years],
  );

  const interest = useTweenedSeries(interestTarget, duration);
  const principal = useTweenedSeries(principalTarget, duration);

  const max = niceMax(
    interestTarget.reduce((peak, value, index) => Math.max(peak, value + principalTarget[index]), 0),
  );

  const plotWidth = innerWidth(BAR_PLOT);
  const plotHeight = innerHeight(BAR_PLOT);
  const barWidth = plotWidth / years;
  const gap = Math.min(6, barWidth * 0.28);
  const floor = BAR_PLOT.top + plotHeight;

  return (
    <ChartCard
      className={className}
      title="Where each year's money lands"
      hint="The crossover is the point your payment starts working for you"
      legend={[
        { label: "Principal \u2014 equity you keep", color: "var(--jade)" },
        { label: "Interest \u2014 gone", color: "var(--crimson)" },
      ]}
    >
      <ChartFrame
        plot={BAR_PLOT}
        max={max}
        length={years}
        unitsPerYear={1}
        startYear={start.year}
        title="Yearly split between principal and interest"
      >
        {interest.map((interestValue, index) => {
          const x = BAR_PLOT.left + index * barWidth + gap / 2;
          const width = Math.max(1, barWidth - gap);
          const interestHeight = (interestValue / max) * plotHeight;
          const principalHeight = (principal[index] / max) * plotHeight;

          return (
            <g key={index}>
              {principalHeight > 0.4 ? (
                <rect
                  x={x}
                  y={floor - interestHeight - principalHeight}
                  width={width}
                  height={principalHeight}
                  fill="var(--jade)"
                  rx={2}
                  opacity={0.92}
                />
              ) : null}
              {interestHeight > 0.4 ? (
                <rect
                  x={x}
                  y={floor - interestHeight}
                  width={width}
                  height={interestHeight}
                  fill="var(--crimson)"
                  rx={2}
                  opacity={0.92}
                />
              ) : null}
            </g>
          );
        })}
      </ChartFrame>
    </ChartCard>
  );
}
