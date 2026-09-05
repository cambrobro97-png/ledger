"use client";

import { innerHeight, innerWidth, type Plot } from "@/components/charts/geometry";
import { MonthTicks } from "./MonthTicks";
import styles from "./ColumnChart.module.css";

/** Same box as `SPARK_PLOT`: no axes, so every unit goes to the columns. */
const COLUMN_PLOT: Plot = { width: 320, height: 64, left: 0, right: 0, top: 3, bottom: 3 };

export interface ColumnChartProps {
  values: number[];
  /** Fill for columns at or above the zero rule, and for those below it. */
  positive: string;
  negative: string;
  /** Draws month initials underneath. Only meaningful for a twelve-value series. */
  months?: boolean;
  label: string;
}

/**
 * Columns hanging off a zero rule.
 *
 * The rule sits where zero actually falls between the highest and lowest value
 * rather than at the floor, so a month in deficit reads as *below the line* —
 * which is the whole reason to draw this instead of a sparkline.
 */
export function ColumnChart({ values, positive, negative, months, label }: ColumnChartProps) {
  const plotWidth = innerWidth(COLUMN_PLOT);
  const plotHeight = innerHeight(COLUMN_PLOT);

  const high = Math.max(0, ...values);
  const low = Math.min(0, ...values);
  // Scaled to the data rather than to a rounded ceiling: with no axis labels to
  // land on, rounding up would only shrink every column for nothing.
  const span = high - low || 1;
  const zeroY = COLUMN_PLOT.top + (high / span) * plotHeight;

  const columnWidth = plotWidth / Math.max(1, values.length);
  const gap = Math.min(4, columnWidth * 0.3);

  return (
    <div>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${COLUMN_PLOT.width} ${COLUMN_PLOT.height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        {values.map((value, index) => {
          const height = (Math.abs(value) / span) * plotHeight;
          // A month that is short by a rounding error still deserves a mark,
          // otherwise the column silently disappears and reads as no data.
          const drawn = Math.max(height, value === 0 ? 0 : 0.75);
          return (
            <rect
              key={index}
              x={COLUMN_PLOT.left + index * columnWidth + gap / 2}
              y={value >= 0 ? zeroY - drawn : zeroY}
              width={Math.max(1, columnWidth - gap)}
              height={drawn}
              fill={value >= 0 ? positive : negative}
              opacity={0.92}
            />
          );
        })}

        <line
          className={styles.zero}
          x1={COLUMN_PLOT.left}
          x2={COLUMN_PLOT.left + plotWidth}
          y1={zeroY}
          y2={zeroY}
        />
      </svg>

      {months ? <MonthTicks /> : null}
    </div>
  );
}
