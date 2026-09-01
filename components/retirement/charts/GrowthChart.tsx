"use client";

import { useMemo } from "react";
import { padYears } from "@/lib/amortization";
import { formatMoney } from "@/lib/format";
import { useTweenedSeries } from "@/hooks/useTween";
import type { Projection } from "@/lib/types";
import { ChartCard } from "../../charts/ChartCard";
import { ChartFrame } from "../../charts/ChartFrame";
import { useChartHover } from "../../charts/useChartHover";
import { BAR_PLOT, innerHeight, innerWidth, niceMax } from "../../charts/geometry";

interface GrowthChartProps {
  current: Projection;
  /** Years the horizon runs, so the bar count stays stable between outlooks. */
  length: number;
  startYear: number;
  currentAge: number;
  duration: number;
  className?: string;
}

const sampleAt = (series: number[], index: number) =>
  series[Math.min(index, series.length - 1)] ?? 0;

/** What each year adds, and what it takes back out once you stop working. */
export function GrowthChart({
  current,
  length,
  startYear,
  currentAge,
  duration,
  className,
}: GrowthChartProps) {
  const contributionsTarget = useMemo(
    () => padYears(current.contributionsByYear, length),
    [current.contributionsByYear, length],
  );
  const matchTarget = useMemo(
    () => padYears(current.matchByYear, length),
    [current.matchByYear, length],
  );
  const growthTarget = useMemo(
    () => padYears(current.growthByYear, length),
    [current.growthByYear, length],
  );
  const withdrawalTarget = useMemo(
    () => padYears(current.withdrawalsByYear, length),
    [current.withdrawalsByYear, length],
  );

  const contributions = useTweenedSeries(contributionsTarget, duration);
  const match = useTweenedSeries(matchTarget, duration);
  const growth = useTweenedSeries(growthTarget, duration);
  const withdrawals = useTweenedSeries(withdrawalTarget, duration);

  // One scale for both directions, so a bar above the axis and one below are
  // directly comparable in height.
  const peakUp = contributionsTarget.reduce(
    (peak, value, index) => Math.max(peak, value + matchTarget[index] + growthTarget[index]),
    0,
  );
  const peakDown = withdrawalTarget.reduce((peak, value) => Math.max(peak, value), 0);
  // Symmetric around zero, so the frame's midpoint gridline lands exactly on
  // the zero line the bars hang from.
  const reach = niceMax(Math.max(peakUp, peakDown));

  const { index, handlers } = useChartHover(BAR_PLOT, length);

  const plotWidth = innerWidth(BAR_PLOT);
  const plotHeight = innerHeight(BAR_PLOT);
  const barWidth = plotWidth / length;
  const gap = Math.min(6, barWidth * 0.28);

  // The zero line sits at the midpoint: additions rise, withdrawals hang below.
  const axis = BAR_PLOT.top + plotHeight / 2;
  const half = plotHeight / 2;
  const heightFor = (value: number) => (value / reach) * half;

  const readout =
    index === null ? (
      " "
    ) : (
      <>
        <span>age {currentAge + index}</span>
        <span>
          growth{" "}
          <strong style={{ color: "var(--brass)" }}>
            {formatMoney(sampleAt(current.growthByYear, index))}
          </strong>
        </span>
        <span>
          added{" "}
          <strong style={{ color: "var(--jade)" }}>
            {formatMoney(
              sampleAt(current.contributionsByYear, index) + sampleAt(current.matchByYear, index),
            )}
          </strong>
        </span>
        <span>
          taken out{" "}
          <strong style={{ color: "var(--crimson)" }}>
            {formatMoney(sampleAt(current.withdrawalsByYear, index))}
          </strong>
        </span>
      </>
    );

  return (
    <ChartCard
      className={className}
      title="What each year adds, and what it takes"
      hint="Above the line the balance grows; below it, you're living on it"
      readout={readout}
      legend={[
        { label: "Your contributions", color: "var(--jade)" },
        { label: "Employer match", color: "#5aa9e6" },
        { label: "Investment growth", color: "var(--brass)" },
        { label: "Withdrawals", color: "var(--crimson)" },
      ]}
    >
      <ChartFrame
        plot={BAR_PLOT}
        max={reach}
        min={-reach}
        length={length}
        unitsPerYear={1}
        startYear={startYear}
        title="Contributions, match, and growth each year against withdrawals"
        {...handlers}
      >
        {contributions.map((contribution, barIndex) => {
          const x = BAR_PLOT.left + barIndex * barWidth + gap / 2;
          const width = Math.max(1, barWidth - gap);

          const contributionHeight = heightFor(contribution);
          const matchHeight = heightFor(match[barIndex]);
          const growthHeight = heightFor(growth[barIndex]);
          const withdrawalHeight = heightFor(withdrawals[barIndex]);

          return (
            <g key={barIndex}>
              {contributionHeight > 0.4 ? (
                <rect
                  x={x}
                  y={axis - contributionHeight}
                  width={width}
                  height={contributionHeight}
                  fill="var(--jade)"
                  opacity={0.92}
                />
              ) : null}
              {matchHeight > 0.4 ? (
                <rect
                  x={x}
                  y={axis - contributionHeight - matchHeight}
                  width={width}
                  height={matchHeight}
                  fill="#5aa9e6"
                  opacity={0.92}
                />
              ) : null}
              {growthHeight > 0.4 ? (
                <rect
                  x={x}
                  y={axis - contributionHeight - matchHeight - growthHeight}
                  width={width}
                  height={growthHeight}
                  fill="var(--brass)"
                  opacity={0.92}
                />
              ) : null}
              {withdrawalHeight > 0.4 ? (
                <rect
                  x={x}
                  y={axis}
                  width={width}
                  height={withdrawalHeight}
                  fill="var(--crimson)"
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
