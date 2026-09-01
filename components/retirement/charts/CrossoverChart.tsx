"use client";

import { useMemo } from "react";
import { padYears } from "@/lib/amortization";
import { formatMoney } from "@/lib/format";
import { useTweenedSeries } from "@/hooks/useTween";
import type { Projection } from "@/lib/types";
import { ChartCard } from "../../charts/ChartCard";
import { ChartFrame, PayoffMarker } from "../../charts/ChartFrame";
import { useChartHover } from "../../charts/useChartHover";
import {
  LINE_PLOT,
  innerHeight,
  innerWidth,
  linePath,
  niceMax,
} from "../../charts/geometry";

interface CrossoverChartProps {
  current: Projection;
  length: number;
  startYear: number;
  currentAge: number;
  duration: number;
  className?: string;
}

const sampleAt = (series: number[], index: number) =>
  series[Math.min(index, series.length - 1)] ?? 0;

/**
 * The year the portfolio can carry your spending. The green line is what
 * stopping work that year would pay out annually for the rest of the plan, so
 * where it passes the cost of living is the retirement age above — drawn
 * rather than asserted.
 */
export function CrossoverChart({
  current,
  length,
  startYear,
  currentAge,
  duration,
  className,
}: CrossoverChartProps) {
  const spendingTarget = useMemo(
    () => padYears(current.spendingByYear, length),
    [current.spendingByYear, length],
  );
  const drawTarget = useMemo(
    () => padYears(current.sustainableDrawByYear, length),
    [current.sustainableDrawByYear, length],
  );

  const spending = useTweenedSeries(spendingTarget, duration);
  const draw = useTweenedSeries(drawTarget, duration);

  // The draw curve runs away near the horizon — stopping with a year left
  // means spending the whole balance in that year — which would flatten the
  // years that actually matter into the floor. Scale to the crossing instead
  // and let the tail leave the top of the frame.
  const max = useMemo(() => {
    const peakSpend = spendingTarget.reduce((peak, value) => Math.max(peak, value), 0);
    const crossing = drawTarget.findIndex((value, year) => value >= spendingTarget[year]);
    const headroom =
      crossing === -1
        ? drawTarget.reduce((peak, value) => Math.max(peak, value), 0)
        : // A little past the crossing, so the lines part visibly rather than
          // meeting exactly at the top edge.
          drawTarget[Math.min(drawTarget.length - 1, crossing + 5)];

    return niceMax(Math.max(peakSpend, headroom));
  }, [spendingTarget, drawTarget]);

  const { index, handlers } = useChartHover(LINE_PLOT, length - 1);

  const readout =
    index === null ? (
      " "
    ) : (
      <>
        <span>age {currentAge + index}</span>
        <span>
          a year costs{" "}
          <strong style={{ color: "var(--crimson)" }}>
            {formatMoney(sampleAt(current.spendingByYear, index))}
          </strong>
        </span>
        <span>
          stopping here pays{" "}
          <strong style={{ color: "var(--jade)" }}>
            {formatMoney(sampleAt(current.sustainableDrawByYear, index))}
          </strong>
        </span>
      </>
    );

  return (
    <ChartCard
      className={className}
      title="When the portfolio can carry you"
      hint="Where the green line passes the red one, work becomes optional"
      readout={readout}
      legend={[
        { label: "What stopping that year would pay, every year after", color: "var(--jade)" },
        { label: "What a year costs, inflating", color: "var(--crimson)" },
      ]}
    >
      <ChartFrame
        plot={LINE_PLOT}
        max={max}
        length={length - 1}
        unitsPerYear={1}
        startYear={startYear}
        title="Safe withdrawal against cost of living"
        {...handlers}
      >
        <defs>
          <clipPath id="crossover-clip">
            <rect
              x={LINE_PLOT.left}
              y={LINE_PLOT.top}
              width={innerWidth(LINE_PLOT)}
              height={innerHeight(LINE_PLOT)}
            />
          </clipPath>
        </defs>

        <g clipPath="url(#crossover-clip)">
          <path
            d={linePath(LINE_PLOT, spending, max, length - 1)}
            fill="none"
            stroke="var(--crimson)"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <path
            d={linePath(LINE_PLOT, draw, max, length - 1)}
            fill="none"
            stroke="var(--jade)"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </g>

        {current.shortfall ? null : (
          <PayoffMarker
            plot={LINE_PLOT}
            index={current.retirementYearIndex}
            length={length - 1}
            color="var(--brass)"
            label="retire"
          />
        )}
      </ChartFrame>
    </ChartCard>
  );
}
