"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { niceMax } from "@/components/charts/geometry";
import { useTweenedViewport, type Viewport } from "@/hooks/useTween";
import { daysInMonth, daysInYear, monthStartDays } from "@/lib/days";
import { stackByDay } from "@/lib/schedule";
import type { Occurrence, StackedOccurrence } from "@/lib/types";
import type { BandScale, TimelineData } from "./types";

/**
 * Below this many months in view, the day axis has taken over from the month
 * axis. Crossing it is what "zoomed in" means.
 */
const DAY_VIEW_SPAN = 3;

/** Fades a value in over the last stretch of the zoom, for the day-level layer. */
function dayViewProgress(span: number): number {
  return Math.max(0, Math.min(1, (DAY_VIEW_SPAN - span) / (DAY_VIEW_SPAN - 1)));
}

export interface TimelineEngine {
  /** The live, tweened window in days. */
  view: Viewport;
  viewSpan: number;
  /** 0 at the year, 1 once one month fills the plot; fades the day layer in. */
  dayProgress: number;
  starts: number[];
  yearLength: number;
  /** Days in the open month, or null at the year. */
  visibleDays: number | null;
  /** Column ceiling, from the heaviest day rather than the heaviest payment. */
  max: number;
  stacks: Map<string, StackedOccurrence>;

  litMonth: number | null;
  setLitMonth: (month: number | null) => void;
  /** Resolves a 0..1 position along the time axis to a month. Axis-agnostic:
   *  each renderer supplies its own ratio from clientX or clientY. */
  monthAtRatio: (ratio: number) => number;
  /** Toggles a month open or closed. */
  toggleMonth: (month: number) => void;
  /** 0..1 opacity for one month's band segment. */
  bandOpacity: (month: number) => number;
  /** Whether a payment should be drawn right now.
   *
   *  In month view only the open month's payments belong on the chart. The
   *  pixel culling each renderer does keeps slop so a mark near an edge isn't
   *  clipped mid-tween, but that slop is wide enough to admit the neighbouring
   *  months' boundary days, which then sit inside the plot looking like part of
   *  the open month — and aren't selectable, since the hit layer filters by
   *  month. This is the one rule for both, so what's drawn and what can be
   *  picked are always the same set.
   *
   *  Measured against the live tweened window rather than the target month, so
   *  the neighbours stay on screen and slide out as the zoom runs instead of
   *  vanishing on its first frame. */
  inView: (occurrence: Occurrence) => boolean;

  /** Hovered (desktop) or selected (touch) — whichever is active. */
  active: Occurrence | null;
  hover: (occurrence: Occurrence | null) => void;
  select: (occurrence: Occurrence | null) => void;
  clear: () => void;
}

interface EngineArgs {
  year: number;
  data: TimelineData;
  zoomMonth: number | null;
  onZoomMonth: (month: number | null) => void;
  bandScale: BandScale;
  duration: number;
}

/**
 * Everything the two renderers share: the viewport tween, month hit-testing,
 * the per-day stacks, the band's shading, and the hover/select state. The
 * renderers own only their coordinate math and their SVG.
 */
export function useTimelineEngine({
  year,
  data,
  zoomMonth,
  onZoomMonth,
  bandScale,
  duration,
}: EngineArgs): TimelineEngine {
  const [litMonth, setLitMonth] = useState<number | null>(null);
  const [hovered, setHovered] = useState<Occurrence | null>(null);
  const [selected, setSelected] = useState<Occurrence | null>(null);

  // A payment is only selectable inside an open month (vertical/touch), so a
  // selection can't outlive a zoom-out — drop it, and the highlight with it.
  useEffect(() => {
    if (zoomMonth === null && selected !== null) setSelected(null);
  }, [zoomMonth, selected]);

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

  const max = niceMax(data.largestDay);
  const stacks = useMemo(() => stackByDay(data.occurrences), [data.occurrences]);
  const visibleDays = zoomMonth === null ? null : daysInMonth(year, zoomMonth);

  const monthAtRatio = useCallback(
    (ratio: number) => {
      const day = view.start + Math.max(0, Math.min(1, ratio)) * viewSpan;
      const month = starts.findIndex((start, index) => index < 12 && day < starts[index + 1]);
      return month === -1 ? 11 : month;
    },
    [view.start, viewSpan, starts],
  );

  const toggleMonth = useCallback(
    (month: number) => onZoomMonth(month === zoomMonth ? null : month),
    [onZoomMonth, zoomMonth],
  );

  const bandOpacity = useCallback(
    (month: number) => {
      const amount = data.byMonth[month];
      if (bandScale.kind === "share") {
        return 0.28 + (amount / (data.total || 1)) * 3.2;
      }
      if (amount <= 0) return 0.12;
      // A year of identical months has no contrast to draw; one flat mid-tone
      // is honest about that, where dividing by zero would not be.
      const range = bandScale.high - bandScale.low;
      return range > 0 ? 0.3 + ((amount - bandScale.low) / range) * 0.6 : 0.5;
    },
    [data.byMonth, data.total, bandScale],
  );

  const inView = useCallback(
    (occurrence: Occurrence) => {
      if (zoomMonth === null) return true;
      // The open month's own payments are always drawn. Everything else is kept
      // only while the tween still has it inside the window, so a zoom slides
      // the neighbours out rather than blinking them away.
      if (occurrence.day.month === zoomMonth) return true;
      return occurrence.dayOfYear >= view.start && occurrence.dayOfYear < view.end;
    },
    [zoomMonth, view.start, view.end],
  );

  const hover = useCallback((occurrence: Occurrence | null) => setHovered(occurrence), []);
  const select = useCallback(
    (occurrence: Occurrence | null) =>
      setSelected((prev) => (prev && occurrence && prev.id === occurrence.id ? null : occurrence)),
    [],
  );
  const clear = useCallback(() => {
    setHovered(null);
    setSelected(null);
    setLitMonth(null);
  }, []);

  return {
    view,
    viewSpan,
    dayProgress,
    starts,
    yearLength,
    visibleDays,
    max,
    stacks,
    litMonth,
    setLitMonth,
    monthAtRatio,
    toggleMonth,
    bandOpacity,
    inView,
    active: selected ?? hovered,
    hover,
    select,
    clear,
  };
}
