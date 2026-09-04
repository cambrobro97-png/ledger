"use client";

import { areaPath, linePath, niceMax, type Plot } from "@/components/charts/geometry";
import styles from "./Sparkline.module.css";

/**
 * A widget-sized plot box. No margins: a sparkline carries no axes, so every
 * unit goes to the line itself. The tool charts' `LINE_PLOT` and friends
 * reserve room for labels this doesn't have.
 */
export const SPARK_PLOT: Plot = {
  width: 320,
  height: 64,
  left: 0,
  right: 0,
  top: 4,
  bottom: 4,
};

export interface SparklineProps {
  /** One or more series, drawn in order. */
  series: { values: number[]; color: string; fill?: boolean }[];
  /**
   * Shared ceiling, so multiple series stay comparable. Derived when absent.
   *
   * Note this is a *ceiling*, not a scale: the floor is taken from the data
   * too (see below), so passing a `niceMax` here still leaves the lines using
   * the full box.
   */
  max?: number;
  label: string;
}

/**
 * A compact line chart built straight from `components/charts/geometry.ts`.
 * That module is pure, so the widgets reuse the tools' own path maths without
 * pulling in chart components sized for a full page.
 */
export function Sparkline({ series, max, label }: SparklineProps) {
  const values = series.flatMap((entry) => entry.values);
  const high = max ?? niceMax(Math.max(1, ...values));
  const low = Math.min(...values, high);

  /*
   * Sparklines are scaled to their own range rather than down from zero.
   * Monthly figures that never come near zero — income hovering around $7k —
   * would otherwise draw as two flat lines pinned to the floor, which shows
   * the reader nothing. A 12% margin under the lowest point keeps the shape
   * readable without implying the series touches zero.
   */
  const floor = low - (high - low) * 0.12;
  const span = high - floor || 1;

  // `yAt` measures from zero, so the values are rebased onto the visible
  // window before they are handed over.
  const rebase = (entry: number[]) => entry.map((value) => value - floor);
  const ceiling = span;

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${SPARK_PLOT.width} ${SPARK_PLOT.height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      {series.map((entry, index) => {
        // `length` is the divisor `xAt` spreads points across; one fewer than
        // the point count puts the last point exactly on the right edge.
        const steps = Math.max(1, entry.values.length - 1);
        const points = rebase(entry.values);
        return (
          <g key={index}>
            {entry.fill ? (
              <path
                className={styles.area}
                d={areaPath(SPARK_PLOT, points, ceiling, steps)}
                fill={entry.color}
              />
            ) : null}
            <path
              className={styles.line}
              d={linePath(SPARK_PLOT, points, ceiling, steps)}
              stroke={entry.color}
            />
          </g>
        );
      })}
    </svg>
  );
}
