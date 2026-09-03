"use client";

import { useEffect, useRef, useState } from "react";
import type { Plot } from "@/components/charts/geometry";
import { verticalPlot } from "./geometry";

/** Breathing room below the chart before the viewport's bottom edge. */
const BOTTOM_GUTTER = 24;
/** Never draw the chart shorter than this — below it there's nothing legible. */
const MIN_HEIGHT = 340;
/** Nor taller: a very tall window doesn't need a full-screen chart. */
const MAX_HEIGHT = 900;
/**
 * URL bars are ~50–60px tall. A visualViewport change smaller than this is the
 * browser chrome collapsing under a scroll, not a new layout — re-measuring on
 * it would relayout every mark mid-scroll.
 */
const CHROME_SLACK = 80;

/** `visualViewport` follows the URL bar live; `innerHeight` is the fallback and
 *  matches what `100dvh` resolves to. Optional-chained for SSR and old Safari. */
function viewportHeight(): number {
  return window.visualViewport?.height ?? window.innerHeight;
}

export interface VerticalPlotBox {
  ref: React.RefObject<HTMLDivElement | null>;
  /**
   * The whole box the timeline owns — chart plus the card's reserved spot —
   * or null until the first measurement lands, so nothing renders at a guess.
   */
  box: { width: number; height: number } | null;
}

/**
 * Measures the chart's box and reports its size in real CSS pixels, so the
 * viewBox can be emitted 1:1 and a `font-size: 11px` label renders at 11 actual
 * pixels. The height is chosen to fit the viewport (svh semantics) so the whole
 * year is visible without scrolling; the width fills the container.
 *
 * The box is deliberately independent of zoom state: the card's spot is carved
 * out of this height by the renderer, never added to it. Measuring per zoom
 * state would resize the chart — and every panel below it — on every month
 * you opened.
 */
export function useVerticalPlot(enabled: boolean): VerticalPlotBox {
  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  // The last viewport height we accepted, to reject URL-bar-only changes.
  const lastViewportRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setBox(null);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      // Read position before applying any new height, so the chart's own height
      // never feeds back into where the top of its box sits.
      const bounds = node.getBoundingClientRect();
      const width = bounds.width;
      if (width === 0) return;
      const avail = viewportHeight() - bounds.top - BOTTOM_GUTTER;
      const height = Math.round(Math.max(MIN_HEIGHT, Math.min(avail, MAX_HEIGHT)));
      lastViewportRef.current = viewportHeight();
      setBox((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
    };

    measure();

    // Width and layout-driven height (rotation, header rewrap) re-measure.
    const observer = new ResizeObserver(measure);
    observer.observe(node);

    // A visualViewport resize that's just the URL bar collapsing is ignored;
    // a real layout change (rotation) crosses the slack and re-measures.
    const onViewportResize = () => {
      if (Math.abs(viewportHeight() - lastViewportRef.current) > CHROME_SLACK) measure();
    };
    window.visualViewport?.addEventListener("resize", onViewportResize);

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", onViewportResize);
    };
  }, [enabled]);

  return { ref, box };
}

/**
 * The chart's plot: the whole measured box. The card floats over the chart
 * rather than sitting below it, so nothing is reserved and the chart's height
 * never depends on the zoom or the selection.
 */
export function chartPlot(box: { width: number; height: number }): Plot {
  return verticalPlot(box.width, box.height);
}
