"use client";

import { innerHeight, linePath, xAt, yAt, type Plot } from "@/components/charts/geometry";
import styles from "./GapChart.module.css";

/** `SPARK_PLOT` with a little more room, so two lines don't sit on top of each other. */
const GAP_PLOT: Plot = { width: 320, height: 68, left: 0, right: 0, top: 5, bottom: 5 };

export interface GapSeries {
  values: number[];
  color: string;
}

export interface GapChartProps {
  upper: GapSeries;
  lower: GapSeries;
  /**
   * Shades the region between the lines from this index on. Leave it out to
   * shade nothing; pass a crossing point to shade only the side of it that
   * means something.
   */
  fillFrom?: number;
  fillColor?: string;
  /**
   * A dashed rule at this index — a payoff month, a crossing. Left unlabelled:
   * the viewBox is stretched to the card's width, which would stretch type with
   * it, so what the rule marks is said in `label` and in the widget's own
   * detail line instead.
   */
  marker?: number;
  label: string;
}

/**
 * Two lines and the ground between them.
 *
 * The gap is the subject: interest a scenario avoids, or the margin by which a
 * portfolio out-earns what it costs to live. Both series share one scale, which
 * is what makes the distance between them mean anything.
 */
export function GapChart({
  upper,
  lower,
  fillFrom,
  fillColor,
  marker,
  label,
}: GapChartProps) {
  // Two series of different lengths would pair up month 40 with month 60 and
  // shade a gap that does not exist, so the longer one is simply cut short.
  const length = Math.min(upper.values.length, lower.values.length);
  if (length < 2) return null;

  const top = upper.values.slice(0, length);
  const bottom = lower.values.slice(0, length);

  const high = Math.max(...top, ...bottom);
  const low = Math.min(...top, ...bottom);
  // Scaled to its own range with a margin under the lowest point, for the
  // reason Sparkline sets out: series that never come near zero would
  // otherwise draw as two flat lines along the floor.
  const floor = low - (high - low) * 0.12;
  const ceiling = high - floor || 1;
  const steps = length - 1;

  const rebase = (values: number[]) => values.map((value) => value - floor);
  const topPoints = rebase(top);
  const bottomPoints = rebase(bottom);

  const at = (points: number[], index: number) =>
    `${xAt(GAP_PLOT, index, steps).toFixed(2)} ${yAt(GAP_PLOT, points[index], ceiling).toFixed(2)}`;

  /*
   * `geometry.betweenPath` shades a whole series pair. Here the region starts
   * partway along — before a crossing point the lines are the wrong way round,
   * and shading there would colour in the opposite of what the widget claims.
   */
  let gapPath = "";
  const start = fillFrom ?? -1;
  if (fillColor && start >= 0 && start < steps) {
    gapPath = `M${at(topPoints, start)}`;
    for (let index = start + 1; index < length; index += 1) gapPath += `L${at(topPoints, index)}`;
    for (let index = length - 1; index >= start; index -= 1) gapPath += `L${at(bottomPoints, index)}`;
    gapPath += "Z";
  }

  const markerX = marker !== undefined && marker < length ? xAt(GAP_PLOT, marker, steps) : null;

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${GAP_PLOT.width} ${GAP_PLOT.height}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      {gapPath ? <path className={styles.gap} d={gapPath} fill={fillColor} /> : null}

      {markerX !== null ? (
        <line
          className={styles.marker}
          x1={markerX}
          x2={markerX}
          y1={GAP_PLOT.top}
          y2={GAP_PLOT.top + innerHeight(GAP_PLOT)}
        />
      ) : null}

      <path
        className={styles.line}
        d={linePath(GAP_PLOT, bottomPoints, ceiling, steps)}
        stroke={lower.color}
      />
      <path
        className={styles.line}
        d={linePath(GAP_PLOT, topPoints, ceiling, steps)}
        stroke={upper.color}
      />
    </svg>
  );
}
