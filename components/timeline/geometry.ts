import type { Plot } from "@/components/charts/geometry";

/** Width of the month rail, in CSS pixels. */
export const RAIL_WIDTH = 46;

/** Gap between the rail and the plot's left edge, where the day ticks and their
 *  labels sit once a month is open. Wide enough for a right-anchored two-digit
 *  label (~12px at 10px mono) plus its 5px tick and the breathing room either
 *  side, so a day number never paints over the rail behind it. */
export const RAIL_GAP = 26;

/**
 * The vertical timeline's plot, built from a measured box rather than a
 * constant. Its viewBox is emitted in real CSS pixels (see useVerticalPlot), so
 * a `font-size: 11px` label renders at 11 actual pixels — the horizontal
 * renderer's type sizes carry over unchanged and stay legible on a phone.
 */
export function verticalPlot(width: number, height: number): Plot {
  return {
    width,
    height,
    // The rail down the left edge, plus the lane the day ticks live in.
    left: RAIL_WIDTH + RAIL_GAP,
    right: 16,
    // Half a mark's maximum thickness, so the first and last day's bar can't
    // be clipped by the top or bottom edge of the box.
    top: 12,
    bottom: 12,
  };
}
