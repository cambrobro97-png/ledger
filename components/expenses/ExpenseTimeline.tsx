"use client";

import {
  useCallback,
  useId,
  useMemo,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { TIMELINE_PLOT, innerHeight, innerWidth, niceMax } from "@/components/charts/geometry";
import { useTweenedViewport, type Viewport } from "@/hooks/useTween";
import { MONTH_NAMES } from "@/lib/dates";
import { daysInMonth, daysInYear, monthStartDays } from "@/lib/days";
import { formatMoneyCompact } from "@/lib/format";
import { categoryAccent, stackByDay } from "@/lib/expenses";
import type { ExpenseItem, ExpenseYear, Occurrence } from "@/lib/types";
import { ExpenseTooltip } from "./ExpenseTooltip";
import styles from "./ExpenseTimeline.module.css";

interface ExpenseTimelineProps {
  year: number;
  derived: ExpenseYear;
  items: ExpenseItem[];
  /** Month currently expanded, or null for the whole year. */
  zoomMonth: number | null;
  onZoomMonth: (month: number | null) => void;
  hoveredItemId: string | null;
  onHoverItem: (id: string | null) => void;
  duration: number;
}

const PLOT = TIMELINE_PLOT;
const PLOT_WIDTH = innerWidth(PLOT);
const PLOT_HEIGHT = innerHeight(PLOT);
const FLOOR = PLOT.top + PLOT_HEIGHT;
const BAND_TOP = 16;
const BAND_HEIGHT = 26;

/** Smallest hover target a band in a stack gets, in viewBox units. */
const MIN_HIT_HEIGHT = 7;

/**
 * Below this many months in view, the day axis has taken over from the month
 * axis. Crossing it is what "zoomed in" means.
 */
const DAY_VIEW_SPAN = 3;

/** Fades a value in over the last stretch of the zoom, for the day-level layer. */
function dayViewProgress(span: number): number {
  return Math.max(0, Math.min(1, (DAY_VIEW_SPAN - span) / (DAY_VIEW_SPAN - 1)));
}

export function ExpenseTimeline({
  year,
  derived,
  items,
  zoomMonth,
  onZoomMonth,
  hoveredItemId,
  onHoverItem,
  duration,
}: ExpenseTimelineProps) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<Occurrence | null>(null);
  /** x of the hovered mark in viewBox units, so the tooltip tracks its column. */
  const [hoveredX, setHoveredX] = useState(0);
  const [litMonth, setLitMonth] = useState<number | null>(null);

  const starts = useMemo(() => monthStartDays(year), [year]);
  const yearLength = daysInYear(year);

  // The window, in days. Memoized so the tween isn't restarted every render.
  const target = useMemo<Viewport>(
    () =>
      zoomMonth === null
        ? { start: 0, end: yearLength }
        : { start: starts[zoomMonth], end: starts[zoomMonth + 1] },
    [zoomMonth, starts, yearLength],
  );

  const view = useTweenedViewport(target, duration);
  const viewSpan = Math.max(1, view.end - view.start);
  const monthsInView = (viewSpan / yearLength) * 12;
  const dayProgress = dayViewProgress(monthsInView);

  /** Maps a day-of-year to an x position through the live viewport. */
  const xFor = useCallback(
    (day: number) => PLOT.left + ((day - view.start) / viewSpan) * PLOT_WIDTH,
    [view.start, viewSpan],
  );

  // Scaled to the tallest column rather than the tallest single payment, so a
  // day carrying three bills still fits inside the plot.
  const max = niceMax(derived.largestDay);

  const stacks = useMemo(() => stackByDay(derived.occurrences), [derived.occurrences]);

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  /** Which month sits under a pointer event, or null if it lands nowhere. */
  const monthAt = useCallback(
    (event: { currentTarget: SVGRectElement; clientX: number }) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (bounds.width === 0) return null;
      const ratio = (event.clientX - bounds.left) / bounds.width;
      const day = view.start + Math.max(0, Math.min(1, ratio)) * viewSpan;
      const month = starts.findIndex((start, index) => index < 12 && day < starts[index + 1]);
      return month === -1 ? 11 : month;
    },
    [view.start, viewSpan, starts],
  );

  const onBandMove = useCallback(
    (event: PointerEvent<SVGRectElement>) => setLitMonth(monthAt(event)),
    [monthAt],
  );

  // Read the month from the click itself rather than from whatever the last
  // hover left behind, so a tap or a click without a preceding move still opens
  // the right month.
  const onBandClick = useCallback(
    (event: MouseEvent<SVGRectElement>) => {
      const month = monthAt(event);
      onZoomMonth(month === null || month === zoomMonth ? null : month);
    },
    [monthAt, onZoomMonth, zoomMonth],
  );

  const visibleDays = zoomMonth === null ? null : daysInMonth(year, zoomMonth);

  /**
   * The band's shading runs between the lightest and heaviest month rather
   * than up from zero. Spending, unlike income, rarely goes near zero in any
   * month — measured against zero the whole year lands in the top of the
   * range and the band reads as twelve identical blocks.
   */
  const range = useMemo(() => {
    const spending = derived.byMonth.filter((amount) => amount > 0);
    if (spending.length === 0) return null;
    const low = Math.min(...spending);
    const high = Math.max(...spending);
    // A year of identical months has no contrast to draw; one flat mid-tone
    // is honest about that, where dividing by zero would not be.
    return high > low ? { low, high } : null;
  }, [derived.byMonth]);

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
        role="img"
        aria-label={`Expenses across ${year}`}
        onPointerLeave={() => {
          setLitMonth(null);
          setHovered(null);
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
            const amount = derived.byMonth[month];
            const weight = range === null ? 0.5 : (amount - range.low) / (range.high - range.low);

            return (
              <g key={name} className={styles.band}>
                <rect
                  x={left}
                  y={BAND_TOP}
                  width={Math.max(0, width - 2)}
                  height={BAND_HEIGHT}
                  rx={6}
                  className={`${styles.segment} ${lit ? styles.segmentLit : ""}`}
                  style={{ opacity: amount > 0 ? 0.3 + weight * 0.6 : 0.12 }}
                />
                {width > 34 ? (
                  <text
                    // A zoomed month grows wider than the plot, so its centre
                    // can sit off-screen; the label is held inside the band
                    // instead. Only a segment that actually overflows is
                    // clamped, so the year's twelve labels stay centred on
                    // their own months.
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
                    {width > 90 ? `${name} · ${formatMoneyCompact(derived.byMonth[month])}` : name}
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
        <line
          x1={PLOT.left}
          y1={FLOOR}
          x2={PLOT.left + PLOT_WIDTH}
          y2={FLOOR}
          className={styles.axis}
        />

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
        {derived.occurrences.map((occurrence) => {
          const x = xFor(occurrence.dayOfYear + 0.5);
          if (x < PLOT.left - 30 || x > PLOT.left + PLOT_WIDTH + 30) return null;

          const item = itemsById.get(occurrence.itemId);
          const accent = categoryAccent(item?.category ?? "other");
          const stack = stacks.get(occurrence.id);
          const base = stack?.base ?? 0;
          const shared = (stack?.count ?? 1) > 1;

          const scale = (value: number) => (value / max) * PLOT_HEIGHT * 0.72;
          // The band runs from the top of everything below it to the top of
          // its own amount, so rounding never accumulates into a seam.
          const bottom = FLOOR - scale(base);
          const top = FLOOR - scale(base + occurrence.amount);
          const height = Math.max(2, bottom - top);
          const width = Math.max(5, Math.min(26, (PLOT_WIDTH / viewSpan) * 0.62));
          const dimmed = hoveredItemId !== null && hoveredItemId !== occurrence.itemId;

          // Only the ends of a column get the corner radius; the joins stay
          // square so the segments read as one bar rather than stacked pills.
          const rounded = Math.min(3, width / 2);
          const capped = !shared || base + occurrence.amount >= (stack?.total ?? 0) - 0.0001;

          return (
            <g
              key={occurrence.id}
              className={`${styles.mark} ${dimmed ? styles.markDim : ""}`}
              style={{ color: accent }}
              onPointerEnter={() => {
                setHovered(occurrence);
                setHoveredX(x);
                onHoverItem(occurrence.itemId);
              }}
              onPointerLeave={() => {
                setHovered(null);
                onHoverItem(null);
              }}
            >
              <rect
                x={x - width / 2}
                y={top}
                width={width}
                height={height}
                rx={capped ? rounded : 0}
                fill={accent}
                className={`${styles.markBody} ${shared ? styles.markBand : ""} ${
                  item?.kind === "variable" ? styles.markVariable : ""
                }`}
                style={
                  shared
                    ? // Grown from the column's own floor, so a stack rises as
                      // one piece instead of each band scaling about itself.
                      { transformOrigin: `${x}px ${bottom}px` }
                    : undefined
                }
              />
              {/* A hairline of the panel colour keeps neighbouring bands legible
                  when two bills happen to share a category. */}
              {shared && !capped ? (
                <line
                  x1={x - width / 2}
                  y1={top}
                  x2={x + width / 2}
                  y2={top}
                  className={styles.markSeam}
                />
              ) : null}
              {/* A wider invisible target, so small marks are still easy to hit.
                  A lone mark claims the full height above it. A band inside a
                  stack claims its own slice, floored at a hittable size — and
                  it grows downward, since the band above is the one whose lower
                  edge a pointer is most likely to be reaching for. */}
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

        {derived.occurrences.length === 0 ? (
          <text
            x={PLOT.left + PLOT_WIDTH / 2}
            y={PLOT.top + PLOT_HEIGHT / 2}
            textAnchor="middle"
            className={styles.empty}
          >
            Nothing lands in {year} yet — add an expense below.
          </text>
        ) : null}
      </svg>

      {hovered ? (
        <ExpenseTooltip
          occurrence={hovered}
          item={itemsById.get(hovered.itemId)}
          left={(hoveredX / PLOT.width) * 100}
          stack={stacks.get(hovered.id)}
        />
      ) : null}
    </div>
  );
}
