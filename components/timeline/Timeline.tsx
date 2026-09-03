"use client";

import { useEffect } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { HorizontalTimeline } from "./HorizontalTimeline";
import { VerticalTimeline } from "./VerticalTimeline";
import { useTimelineEngine } from "./useTimelineEngine";
import { useVerticalPlot } from "./useVerticalPlot";
import { TIMELINE_VERTICAL_QUERY, type TimelineProps } from "./types";
import styles from "./Timeline.module.css";

/**
 * The year's payments, drawn across the screen on desktop and down it on
 * mobile. One engine feeds both renderers, so zooming survives a rotation.
 */
export function Timeline(props: TimelineProps) {
  // Starts false, so the static export renders horizontal and a phone swaps on
  // hydrate. Deliberate — a synchronous read here would be a hydration mismatch.
  const vertical = useMediaQuery(TIMELINE_VERTICAL_QUERY);
  const { ref, plot } = useVerticalPlot(vertical);

  const engine = useTimelineEngine({
    year: props.year,
    data: props.data,
    zoomMonth: props.zoomMonth,
    onZoomMonth: props.onZoomMonth,
    bandScale: props.bandScale,
    duration: props.duration,
  });

  // Escape backs out one level at a time: a selected payment first, then a
  // zoomed month. The active mark lives in the engine, so the timeline owns this
  // rather than the page.
  const { active, clear } = engine;
  const { zoomMonth, onZoomMonth, onHoverItem } = props;
  useEffect(() => {
    if (active === null && zoomMonth === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (active !== null) clear();
      else if (zoomMonth !== null) onZoomMonth(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, clear, zoomMonth, onZoomMonth]);

  // Closing a month drops the touch selection (see the engine); the list
  // highlight it drove goes with it. Guarded on !active so a desktop hover,
  // which self-heals on pointer-leave, is left alone.
  useEffect(() => {
    if (zoomMonth === null && active === null) onHoverItem(null);
  }, [zoomMonth, active, onHoverItem]);

  return (
    <div className={styles.wrap} ref={ref}>
      {vertical ? (
        // Nothing renders until the box is measured, rather than snapping from
        // a guessed size.
        plot ? (
          <VerticalTimeline {...props} engine={engine} plot={plot} />
        ) : null
      ) : (
        <HorizontalTimeline {...props} engine={engine} />
      )}
    </div>
  );
}
