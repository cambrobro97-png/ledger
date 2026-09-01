"use client";

import { useMemo } from "react";
import { padSeries } from "@/lib/amortization";
import { formatMoney } from "@/lib/format";
import { accentFor } from "@/lib/income";
import { useTweenedSeries } from "@/hooks/useTween";
import type { Account, Projection } from "@/lib/types";
import { ChartCard } from "../../charts/ChartCard";
import { ChartFrame, PayoffMarker } from "../../charts/ChartFrame";
import { useChartHover } from "../../charts/useChartHover";
import { LINE_PLOT, areaPath, betweenPath, niceMax } from "../../charts/geometry";

interface AccountsChartProps {
  accounts: Account[];
  current: Projection;
  length: number;
  startYear: number;
  currentAge: number;
  duration: number;
  className?: string;
}

const sampleAt = (series: number[], index: number) =>
  series[Math.min(index, series.length - 1)] ?? 0;

/** Each account as its own band: what builds it up, and what draws it down. */
export function AccountsChart({
  accounts,
  current,
  length,
  startYear,
  currentAge,
  duration,
  className,
}: AccountsChartProps) {
  // Cumulative layers, so band n is the area between layer n-1 and layer n.
  // One flat array keeps the tween a single series of a stable length.
  const stacked = useMemo(() => {
    const layers: number[][] = [];
    const running = new Array(length + 1).fill(0);

    for (const series of current.balancesByAccount) {
      const padded = padSeries(series, length, 0);
      for (let index = 0; index < running.length; index += 1) {
        running[index] += padded[index];
      }
      layers.push([...running]);
    }

    return layers;
  }, [current.balancesByAccount, length]);

  const flat = useMemo(() => stacked.flat(), [stacked]);
  const tweened = useTweenedSeries(flat, duration);

  const width = length + 1;
  const layers = accounts.map((_, index) => tweened.slice(index * width, (index + 1) * width));
  const max = niceMax(current.peakBalance);
  const { index, handlers } = useChartHover(LINE_PLOT, length);

  const readout =
    index === null ? (
      " "
    ) : (
      <>
        <span>age {currentAge + index}</span>
        {accounts.map((account, accountIndex) => (
          <span key={account.id}>
            {account.name}{" "}
            <strong style={{ color: accentFor(account.accent) }}>
              {formatMoney(sampleAt(current.balancesByAccount[accountIndex] ?? [], index))}
            </strong>
          </span>
        ))}
      </>
    );

  return (
    <ChartCard
      className={className}
      title="Where the money sits"
      hint="Hover the chart to read any age"
      readout={readout}
      legend={accounts.map((account) => ({
        label: account.name,
        color: accentFor(account.accent),
      }))}
    >
      <ChartFrame
        plot={LINE_PLOT}
        max={max}
        length={length}
        unitsPerYear={1}
        startYear={startYear}
        title="Balance by account, stacked"
        {...handlers}
      >
        {layers.map((layer, accountIndex) => {
          const below = accountIndex === 0 ? null : layers[accountIndex - 1];
          const colour = accentFor(accounts[accountIndex]?.accent ?? accountIndex);

          return (
            <path
              key={accounts[accountIndex]?.id ?? accountIndex}
              d={
                below
                  ? betweenPath(LINE_PLOT, layer, below, max, length)
                  : areaPath(LINE_PLOT, layer, max, length)
              }
              fill={colour}
              fillOpacity={0.62}
              stroke={colour}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          );
        })}

        {current.shortfall ? null : (
          <PayoffMarker
            plot={LINE_PLOT}
            index={current.retirementYearIndex}
            length={length}
            color="var(--bone)"
            label="retire"
          />
        )}
      </ChartFrame>
    </ChartCard>
  );
}
