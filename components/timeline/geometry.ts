import type { Plot } from "@/components/charts/geometry";

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
    left: 54, // room for the month rail down the left edge
    right: 16,
    top: 14,
    bottom: 14,
  };
}

/** Width of the month rail, in CSS pixels. */
export const RAIL_WIDTH = 46;

/** Gap between the rail and the plot's left edge. */
export const RAIL_GAP = 8;
