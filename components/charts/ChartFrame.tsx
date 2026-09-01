"use client";

import type { PointerEventHandler, ReactNode } from "react";
import { formatMoneyCompact } from "@/lib/format";
import {
  innerHeight,
  innerWidth,
  xAt,
  yAt,
  yearLabelStep,
  type Plot,
} from "./geometry";
import styles from "./charts.module.css";

const GRID_LINES = 4;

interface ChartFrameProps {
  plot: Plot;
  max: number;
  /**
   * Value at the floor of the plot. Zero for an ordinary chart; negative for
   * one that hangs bars below a zero line, so the labels still read true.
   */
  min?: number;
  /** Number of x steps the axis spans (months for line charts, years for bars). */
  length: number;
  /** How many x units make up one year: 12 for monthly series, 1 for yearly. */
  unitsPerYear: number;
  startYear: number;
  children: ReactNode;
  title: string;
  onPointerMove?: PointerEventHandler<SVGSVGElement>;
  onPointerLeave?: PointerEventHandler<SVGSVGElement>;
}

/** Gridlines, money labels, and year ticks. Series are drawn as children on top. */
export function ChartFrame({
  plot,
  max,
  min = 0,
  length,
  unitsPerYear,
  startYear,
  children,
  title,
  onPointerMove,
  onPointerLeave,
}: ChartFrameProps) {
  const totalYears = Math.ceil(length / unitsPerYear);
  const step = yearLabelStep(totalYears);
  const years: number[] = [];
  for (let year = 0; year <= totalYears; year += step) years.push(year);

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${plot.width} ${plot.height}`}
      role="img"
      aria-label={title}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {Array.from({ length: GRID_LINES + 1 }, (_, index) => {
        const value = min + ((max - min) * index) / GRID_LINES;
        // Positions are measured from the floor, which `min` may put below zero.
        const y = yAt(plot, value - min, max - min);
        return (
          <g key={index}>
            <line
              className={styles.gridLine}
              x1={plot.left}
              x2={plot.left + innerWidth(plot)}
              y1={y}
              y2={y}
              strokeWidth={value === 0 ? 1.5 : 1}
            />
            <text className={styles.axisLabel} x={plot.left - 12} y={y + 5} textAnchor="end">
              {formatMoneyCompact(value)}
            </text>
          </g>
        );
      })}

      {years.map((year) => {
        const x = xAt(plot, year * unitsPerYear, length);
        if (x > plot.left + innerWidth(plot) + 1) return null;
        return (
          <text
            key={year}
            className={styles.axisLabel}
            x={x}
            y={plot.height - (plot.bottom - 30)}
            textAnchor="middle"
          >
            {startYear + year}
          </text>
        );
      })}

      {children}
      <rect
        x={plot.left}
        y={plot.top}
        width={innerWidth(plot)}
        height={innerHeight(plot)}
        fill="transparent"
        pointerEvents="none"
      />
    </svg>
  );
}

/** Dashed vertical rule marking the month a scenario finishes. */
export function PayoffMarker({
  plot,
  index,
  length,
  color,
  label = "paid off",
}: {
  plot: Plot;
  index: number;
  length: number;
  color: string;
  label?: string;
}) {
  if (index >= length) return null;
  const x = xAt(plot, index, length);
  const nearRightEdge = x > plot.left + innerWidth(plot) - 110;

  return (
    <g>
      <line
        className={styles.markerLine}
        x1={x}
        x2={x}
        y1={plot.top}
        y2={plot.top + innerHeight(plot)}
        stroke={color}
        strokeWidth={1.5}
      />
      <text
        className={styles.markerLabel}
        x={nearRightEdge ? x - 8 : x + 8}
        y={plot.top + 16}
        fill={color}
        textAnchor={nearRightEdge ? "end" : "start"}
      >
        {label}
      </text>
    </g>
  );
}
