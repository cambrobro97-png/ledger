"use client";

import { useCallback, useId, useMemo, type MouseEvent, type PointerEvent } from "react";
import { TIMELINE_PLOT, innerHeight, innerWidth } from "@/components/charts/geometry";
import { MONTH_NAMES } from "@/lib/dates";
import { formatMoneyCompact } from "@/lib/format";
import { OccurrenceCard } from "./OccurrenceCard";
import type { TimelineEngine } from "./useTimelineEngine";
import type { TimelineProps } from "./types";
import styles from "./TimelineChrome.module.css";

const PLOT = TIMELINE_PLOT;
const PLOT_WIDTH = innerWidth(PLOT);
const PLOT_HEIGHT = innerHeight(PLOT);
const FLOOR = PLOT.top + PLOT_HEIGHT;
const BAND_TOP = 16;
const BAND_HEIGHT = 26;

/** Smallest hover target a band in a stack gets, in viewBox units. */
const MIN_HIT_HEIGHT = 7;

interface Props extends TimelineProps {
  engine: TimelineEngine;
}

/** The year drawn across the screen: months banded along the top, payments as
 *  columns rising from a floor. The desktop layout. */
export function HorizontalTimeline({
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
    inView,
    active,
    hover,
  } = engine;

  const xFor = useCallback(
    (day: number) => PLOT.left + ((day - view.start) / viewSpan) * PLOT_WIDTH,
    [view.start, viewSpan],
  );

  const ratioAt = useCallback((event: { currentTarget: SVGRectElement; clientX: number }) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return null;
    return (event.clientX - bounds.left) / bounds.width;
  }, []);

  const onBandMove = useCallback(
    (event: PointerEvent<SVGRectElement>) => {
      const ratio = ratioAt(event);
      setLitMonth(ratio === null ? null : monthAtRatio(ratio));
    },
    [ratioAt, monthAtRatio, setLitMonth],
  );

  // Read the month from the click itself rather than from whatever the last
  // hover left behind, so a tap or a click without a preceding move still opens
  // the right month.
  const onBandClick = useCallback(
    (event: MouseEvent<SVGRectElement>) => {
      const ratio = ratioAt(event);
      if (ratio !== null) toggleMonth(monthAtRatio(ratio));
    },
    [ratioAt, monthAtRatio, toggleMonth],
  );

  // The tooltip tracks its column, so its x follows the active mark.
  const activeX = useMemo(
    () => (active ? xFor(active.dayOfYear + 0.5) : 0),
    [active, xFor],
  );

  return (
    <>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
        role="img"
        aria-label={title}
        style={{ ["--band" as string]: bandColor }}
        onPointerLeave={() => {
          setLitMonth(null);
          hover(null);
        }}
      >
        <defs>
          {/* The band is clipped so a zoomed month's segment can run past the
              plot edges without escaping the panel. */}
          <clipPath id={`${gradientId}-band`}>
            <rect x={PLOT.left} y={BAND_TOP - 2} width={PLOT_WIDTH} height={BAND_HEIGHT + 4} rx={6} />
          </clipPath>
        </defs>

        {/* Month band: the zoom control, and the year's shape at a glance. */}
        <g clipPath={`url(#${gradientId}-band)`}>
          {MONTH_NAMES.map((name, month) => {
            const left = xFor(starts[month]);
            const right = xFor(starts[month + 1]);
            const width = right - left;
            if (right < PLOT.left - 4 || left > PLOT.left + PLOT_WIDTH + 4) return null;

            const open = zoomMonth === month;
            const lit = litMonth === month || open;

            return (
              <g key={name} className={styles.band}>
                <rect
                  x={left}
                  y={BAND_TOP}
                  width={Math.max(0, width - 2)}
                  height={BAND_HEIGHT}
                  rx={6}
                  className={`${styles.segment} ${lit ? styles.segmentLit : ""}`}
                  style={{ opacity: bandOpacity(month) }}
                />
                {width > 34 ? (
                  <text
                    // A zoomed month grows wider than the plot, so its centre
                    // can sit off-screen; the label is held inside the band
                    // instead. Only a segment that actually overflows is
                    // clamped, so the year's twelve labels stay centred.
                    x={
                      left < PLOT.left || right > PLOT.left + PLOT_WIDTH
                        ? Math.min(
                            Math.max(left + width / 2, PLOT.left + 46),
                            PLOT.left + PLOT_WIDTH - 46,
                          )
                        : left + width / 2
                    }
                    y={BAND_TOP + BAND_HEIGHT / 2 + 4}
                    textAnchor="middle"
                    className={`${styles.bandLabel} ${lit ? styles.bandLabelLit : ""}`}
                  >
                    {width > 90 ? `${name} · ${formatMoneyCompact(data.byMonth[month])}` : name}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* One transparent strip takes every pointer event, so hovering
              never falls into a gap between segments. */}
          <rect
            x={PLOT.left}
            y={BAND_TOP}
            width={PLOT_WIDTH}
            height={BAND_HEIGHT}
            fill="transparent"
            className={styles.bandHit}
            onPointerMove={onBandMove}
            onClick={onBandClick}
          />
        </g>

        {/* Baseline */}
        <line x1={PLOT.left} y1={FLOOR} x2={PLOT.left + PLOT_WIDTH} y2={FLOOR} className={styles.axis} />

        {/* Day ticks, only once a month is open enough to read them. */}
        {visibleDays && dayProgress > 0 ? (
          <g style={{ opacity: dayProgress }}>
            {Array.from({ length: visibleDays }, (_, index) => {
              const day = starts[zoomMonth as number] + index;
              const x = xFor(day + 0.5);
              const label = index + 1;
              const step = visibleDays > 20 && PLOT_WIDTH / visibleDays < 26 ? 5 : 1;
              if (label !== 1 && label % step !== 0) return null;
              return (
                <g key={index}>
                  <line x1={x} y1={FLOOR} x2={x} y2={FLOOR + 5} className={styles.tick} />
                  <text x={x} y={FLOOR + 20} textAnchor="middle" className={styles.dayLabel}>
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        ) : null}

        {/* Month boundaries on the plot, fading out as days take over. */}
        <g style={{ opacity: 1 - dayProgress }}>
          {starts.slice(1, 12).map((start, index) => (
            <line
              key={index}
              x1={xFor(start)}
              y1={PLOT.top}
              x2={xFor(start)}
              y2={FLOOR}
              className={styles.gridline}
            />
          ))}
        </g>

        {/* The payments themselves, stacked into one bar per day. */}
        {data.occurrences.map((occurrence) => {
          // Month view draws only that month's payments — see inView.
          if (!inView(occurrence)) return null;

          const x = xFor(occurrence.dayOfYear + 0.5);
          if (x < PLOT.left - 30 || x > PLOT.left + PLOT_WIDTH + 30) return null;

          const look = appearance(occurrence.itemId);
          const stack = stacks.get(occurrence.id);
          const base = stack?.base ?? 0;
          const shared = (stack?.count ?? 1) > 1;

          const scale = (value: number) => (value / max) * PLOT_HEIGHT * 0.72;
          const bottom = FLOOR - scale(base);
          const top = FLOOR - scale(base + occurrence.amount);
          const height = Math.max(2, bottom - top);
          const width = Math.max(5, Math.min(26, (PLOT_WIDTH / viewSpan) * 0.62));
          const dimmed = hoveredItemId !== null && hoveredItemId !== occurrence.itemId;

          const rounded = Math.min(3, width / 2);
          const capped = !shared || base + occurrence.amount >= (stack?.total ?? 0) - 0.0001;

          return (
            <g
              key={occurrence.id}
              className={`${styles.mark} ${dimmed ? styles.markDim : ""}`}
              style={{ color: look.accent }}
              onPointerEnter={() => {
                hover(occurrence);
                onHoverItem(occurrence.itemId);
              }}
              onPointerLeave={() => {
                hover(null);
                onHoverItem(null);
              }}
            >
              <rect
                x={x - width / 2}
                y={top}
                width={width}
                height={height}
                rx={capped ? rounded : 0}
                fill={look.accent}
                className={`${styles.markBody} ${shared ? styles.markBand : ""} ${
                  look.muted ? styles.markMuted : ""
                }`}
                style={shared ? { transformOrigin: `${x}px ${bottom}px` } : undefined}
              />
              {shared && !capped ? (
                <line
                  x1={x - width / 2}
                  y1={top}
                  x2={x + width / 2}
                  y2={top}
                  className={styles.markSeam}
                />
              ) : null}
              {/* A wider invisible target, so small marks are still easy to hit. */}
              <rect
                x={x - Math.max(9, width / 2)}
                y={shared ? top : PLOT.top}
                width={Math.max(18, width)}
                height={shared ? Math.max(height, MIN_HIT_HEIGHT) : bottom - PLOT.top}
                fill="transparent"
              />
            </g>
          );
        })}

        {data.occurrences.length === 0 ? (
          <text
            x={PLOT.left + PLOT_WIDTH / 2}
            y={PLOT.top + PLOT_HEIGHT / 2}
            textAnchor="middle"
            className={styles.empty}
          >
            {emptyMessage}
          </text>
        ) : null}
      </svg>

      {active ? (
        <OccurrenceCard
          occurrence={active}
          name={nameOf(active.itemId)}
          accent={appearance(active.itemId).accent}
          meta={describe(active.itemId)}
          stack={stacks.get(active.id)}
          peerNoun={peerNoun}
          placement={{ kind: "float", left: (activeX / PLOT.width) * 100 }}
        />
      ) : null}
    </>
  );
}
