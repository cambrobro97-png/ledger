"use client";

import { useMemo } from "react";
import { padSeries } from "@/lib/amortization";
import { parseMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { useTweenedSeries } from "@/hooks/useTween";
import type { Projection } from "@/lib/types";
import { ChartCard } from "../../charts/ChartCard";
import { ChartFrame, PayoffMarker } from "../../charts/ChartFrame";
import { useChartHover } from "../../charts/useChartHover";
import { LINE_PLOT, areaPath, linePath, niceMax } from "../../charts/geometry";

interface PortfolioChartProps {
  baseline: Projection;
  current: Projection;
  /** Years the x-axis spans, always the full horizon. */
  length: number;
  startYear: number;
  currentAge: number;
  duration: number;
  className?: string;
}

const sampleAt = (series: number[], index: number) =>
  series[Math.min(index, series.length - 1)] ?? 0;

/** What the portfolio is worth, this outlook against the market as it stands. */
export function PortfolioChart({
  baseline,
  current,
  length,
  startYear,
  currentAge,
  duration,
  className,
}: PortfolioChartProps) {
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
  const max = niceMax(Math.max(baseline.peakBalance, current.peakBalance));
  const { index, handlers } = useChartHover(LINE_PLOT, length);

  const readout =
    index === null ? (
      " "
    ) : (
      <>
        <span>age {currentAge + index}</span>
        <span>
          this outlook{" "}
          <strong style={{ color: "var(--jade)" }}>
            {formatMoney(sampleAt(current.balances, index))}
          </strong>
        </span>
        <span>
          as it stands <strong>{formatMoney(sampleAt(baseline.balances, index))}</strong>
        </span>
      </>
    );

  return (
    <ChartCard
      className={className}
      title="What the portfolio is worth"
      hint="Hover the chart to read any age"
      readout={readout}
      legend={[
        { label: "This outlook", color: "var(--jade)" },
        { label: "Market as it stands", dashed: true },
      ]}
    >
      <ChartFrame
        plot={LINE_PLOT}
        max={max}
        length={length}
        unitsPerYear={1}
        startYear={startYear}
        title="Portfolio balance from today through the end of the plan"
        {...handlers}
      >
        <defs>
          <linearGradient id="portfolio-fill" x1="0" y1="0" x2="0" y2="1">
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
        <path d={areaPath(LINE_PLOT, linePoints, max, length)} fill="url(#portfolio-fill)" />
        <path
          d={linePath(LINE_PLOT, linePoints, max, length)}
          fill="none"
          stroke="var(--jade)"
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {current.shortfall ? null : (
          <PayoffMarker
            plot={LINE_PLOT}
            index={current.retirementYearIndex}
            length={length}
            color="var(--brass)"
            label="retire"
          />
        )}
      </ChartFrame>
    </ChartCard>
  );
}
