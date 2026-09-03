"use client";

import { useCallback, useId, type MouseEvent, type PointerEvent } from "react";
import type { Plot } from "@/components/charts/geometry";
import { innerHeight, innerWidth } from "@/components/charts/geometry";
import { MONTH_NAMES } from "@/lib/dates";
import { formatMoneyCompact } from "@/lib/format";
import { RAIL_GAP, RAIL_WIDTH } from "./geometry";
import { OccurrenceCard } from "./OccurrenceCard";
import type { TimelineEngine } from "./useTimelineEngine";
import type { TimelineProps } from "./types";
import styles from "./TimelineChrome.module.css";

/** Apple's and Google's shared minimum touch target, in CSS pixels. */
const TOUCH_TARGET = 44;

interface Props extends TimelineProps {
  engine: TimelineEngine;
  plot: Plot;
}

/** The year drawn down the screen: months banded along a left rail, payments as
 *  bars growing rightward from it. The mobile layout, sized to the viewport so
 *  the whole year fits without scrolling. */
export function VerticalTimeline({
  data,
  appearance,
  nameOf,
  describe,
  peerNoun,
  emptyMessage,
  bandColor,
  title,
  zoomMonth,
  hoveredItemId,
  onHoverItem,
  engine,
  plot,
}: Props) {
  const gradientId = useId();
  const {
    view,
    viewSpan,
    dayProgress,
    starts,
    visibleDays,
    max,
    stacks,
    litMonth,
    setLitMonth,
    monthAtRatio,
    toggleMonth,
    bandOpacity,
    active,
    select,
    clear,
  } = engine;

  const PLOT_WIDTH = innerWidth(plot);
  const PLOT_HEIGHT = innerHeight(plot);
  const RAIL = plot.left; // the bars' left edge, right of the month rail
  const RIGHT = plot.left + PLOT_WIDTH;

  /** Maps a day-of-year to a y position through the live viewport. */
  const yFor = useCallback(
    (day: number) => plot.top + ((day - view.start) / viewSpan) * PLOT_HEIGHT,
    [view.start, viewSpan, plot.top, PLOT_HEIGHT],
  );

  const ratioAt = useCallback((event: { currentTarget: SVGRectElement; clientY: number }) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.height === 0) return null;
    return (event.clientY - bounds.top) / bounds.height;
  }, []);

  const onRailMove = useCallback(
    (event: PointerEvent<SVGRectElement>) => {
      const ratio = ratioAt(event);
      setLitMonth(ratio === null ? null : monthAtRatio(ratio));
    },
    [ratioAt, monthAtRatio, setLitMonth],
  );

  const onRailClick = useCallback(
    (event: MouseEvent<SVGRectElement>) => {
      const ratio = ratioAt(event);
      if (ratio !== null) toggleMonth(monthAtRatio(ratio));
    },
    [ratioAt, monthAtRatio, toggleMonth],
  );

  // Day spacing along the time axis, for both tick decimation and hit sizing.
  const dayPitch = PLOT_HEIGHT / viewSpan;

  return (
    <>
      <svg
        className={`${styles.svg} ${styles.svgVertical}`}
        viewBox={`0 0 ${plot.width} ${plot.height}`}
        role="img"
        aria-label={title}
        // Height fixed to the measured pixels rather than left to the aspect
        // ratio, so a width rounding between measure and paint can't drift it.
        style={{ ["--band" as string]: bandColor, height: `${plot.height}px` }}
        // Tapping empty chart clears the selection.
        onClick={() => clear()}
      >
        <defs>
          <clipPath id={`${gradientId}-rail`}>
            <rect x={0} y={plot.top - 2} width={RAIL_WIDTH} height={PLOT_HEIGHT + 4} rx={6} />
          </clipPath>
        </defs>

        {/* Month rail: the zoom control, and the year's shape at a glance. */}
        <g clipPath={`url(#${gradientId}-rail)`}>
          {MONTH_NAMES.map((name, month) => {
            const top = yFor(starts[month]);
            const bottom = yFor(starts[month + 1]);
            const height = bottom - top;
            if (bottom < plot.top - 4 || top > plot.top + PLOT_HEIGHT + 4) return null;

            const open = zoomMonth === month;
            const lit = litMonth === month || open;

            return (
              <g key={name} className={styles.rail}>
                <rect
                  x={0}
                  y={top}
                  width={RAIL_WIDTH}
                  height={Math.max(0, height - 2)}
                  rx={6}
                  className={`${styles.segment} ${lit ? styles.segmentLit : ""}`}
                  style={{ opacity: bandOpacity(month) }}
                />
                {height > 18 ? (
                  <text
                    x={6}
                    // Held inside the rail when a zoomed month overflows it, so
                    // an off-screen centre still shows its label.
                    y={
                      top < plot.top || bottom > plot.top + PLOT_HEIGHT
                        ? Math.min(
                            Math.max(top + height / 2 + 4, plot.top + 14),
                            plot.top + PLOT_HEIGHT - 10,
                          )
                        : top + height / 2 + 4
                    }
                    textAnchor="start"
                    className={`${styles.railLabel} ${lit ? styles.railLabelLit : ""}`}
                  >
                    {height > 46 ? `${name} · ${formatMoneyCompact(data.byMonth[month])}` : name}
                  </text>
                ) : null}
              </g>
            );
          })}

          <rect
            x={0}
            y={plot.top}
            width={RAIL_WIDTH}
            height={PLOT_HEIGHT}
            fill="transparent"
            className={styles.railHit}
            onPointerMove={onRailMove}
            onClick={(event) => {
              event.stopPropagation();
              onRailClick(event);
            }}
          />
        </g>

        {/* Baseline down the left edge of the plot. */}
        <line x1={RAIL} y1={plot.top} x2={RAIL} y2={plot.top + PLOT_HEIGHT} className={styles.axis} />

        {/* Day ticks, once a month is open enough to read them. */}
        {visibleDays && dayProgress > 0 ? (
          <g style={{ opacity: dayProgress }}>
            {Array.from({ length: visibleDays }, (_, index) => {
              const day = starts[zoomMonth as number] + index;
              const y = yFor(day + 0.5);
              const label = index + 1;
              const step = visibleDays > 20 && dayPitch < 13 ? 5 : 1;
              if (label !== 1 && label % step !== 0) return null;
              return (
                <g key={index}>
                  <line x1={RAIL - 5} y1={y} x2={RAIL} y2={y} className={styles.tick} />
                  <text x={RAIL - 8} y={y + 3.5} textAnchor="end" className={styles.dayLabel}>
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        ) : null}

        {/* Month boundaries across the plot, fading out as days take over. */}
        <g style={{ opacity: 1 - dayProgress }}>
          {starts.slice(1, 12).map((start, index) => (
            <line
              key={index}
              x1={RAIL}
              y1={yFor(start)}
              x2={RIGHT}
              y2={yFor(start)}
              className={styles.gridline}
            />
          ))}
        </g>

        {/* The payments themselves, stacked into one bar per day. */}
        {data.occurrences.map((occurrence) => {
          const y = yFor(occurrence.dayOfYear + 0.5);
          if (y < plot.top - 30 || y > plot.top + PLOT_HEIGHT + 30) return null;

          const look = appearance(occurrence.itemId);
          const stack = stacks.get(occurrence.id);
          const base = stack?.base ?? 0;
          const shared = (stack?.count ?? 1) > 1;

          // Value runs along x; 0.86, not the horizontal 0.72, since no floating
          // tooltip needs headroom here.
          const scale = (value: number) => (value / max) * PLOT_WIDTH * 0.86;
          const left = RAIL + scale(base);
          const right = RAIL + scale(base + occurrence.amount);
          const barLength = Math.max(2, right - left);
          const thickness = Math.max(4, Math.min(22, dayPitch * 0.62));
          const dimmed = hoveredItemId !== null && hoveredItemId !== occurrence.itemId;
          const selected = active?.id === occurrence.id;

          const rounded = Math.min(3, thickness / 2);
          const capped = !shared || base + occurrence.amount >= (stack?.total ?? 0) - 0.0001;

          return (
            // Interaction lives on the hit-target layer below, painted on top;
            // these are the visuals only.
            <g
              key={occurrence.id}
              className={`${styles.mark} ${dimmed ? styles.markDim : ""}`}
              style={{ color: look.accent }}
            >
              <rect
                x={left}
                y={y - thickness / 2}
                width={barLength}
                height={thickness}
                rx={capped ? rounded : 0}
                fill={look.accent}
                className={`${styles.markBody} ${styles.markGrow} ${
                  shared ? styles.markBand : ""
                } ${look.muted ? styles.markMuted : ""} ${selected ? styles.markSelected : ""}`}
                style={shared ? { transformOrigin: `${left}px ${y}px` } : undefined}
              />
              {shared && !capped ? (
                <line
                  x1={left}
                  y1={y - thickness / 2}
                  x2={left}
                  y2={y + thickness / 2}
                  className={styles.markSeam}
                />
              ) : null}
            </g>
          );
        })}

        {/* Hit targets in their own layer, painted after every visible mark so
            the later day wins where dense days overlap. Floored at a touchable
            size, but never wider than the day pitch when zoomed, or every target
            would bury its neighbour. */}
        <g>
          {data.occurrences.map((occurrence) => {
            const y = yFor(occurrence.dayOfYear + 0.5);
            if (y < plot.top - 30 || y > plot.top + PLOT_HEIGHT + 30) return null;
            const hit = Math.max(Math.max(4, Math.min(22, dayPitch * 0.62)), Math.min(TOUCH_TARGET, dayPitch));
            return (
              <rect
                key={occurrence.id}
                x={RAIL}
                y={y - hit / 2}
                width={PLOT_WIDTH}
                height={hit}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={(event) => {
                  event.stopPropagation();
                  const selected = active?.id === occurrence.id;
                  select(occurrence);
                  onHoverItem(selected ? null : occurrence.itemId);
                }}
              />
            );
          })}
        </g>

        {data.occurrences.length === 0 ? (
          <text
            x={RAIL + PLOT_WIDTH / 2}
            y={plot.top + PLOT_HEIGHT / 2}
            textAnchor="middle"
            className={styles.empty}
          >
            {emptyMessage}
          </text>
        ) : null}
      </svg>

      <div className={styles.cardSlot}>
        {active ? (
          <OccurrenceCard
            occurrence={active}
            name={nameOf(active.itemId)}
            accent={appearance(active.itemId).accent}
            meta={describe(active.itemId)}
            stack={stacks.get(active.id)}
            peerNoun={peerNoun}
            placement={{ kind: "pinned" }}
          />
        ) : null}
      </div>
    </>
  );
}
