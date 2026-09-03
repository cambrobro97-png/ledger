import type { ReactNode } from "react";
import type { Occurrence } from "@/lib/types";

/** Below this width, the year is drawn down the screen instead of across it.
 *  Kept in sync by hand with the max-width block in Timeline.module.css. */
export const TIMELINE_VERTICAL_QUERY = "(max-width: 700px)";

/**
 * The slice of a derived year the timeline actually draws. Deliberately
 * narrower than IncomeYear or ExpenseYear: both satisfy it structurally, and
 * neither `bySource` nor `byItem` ever reaches the chart.
 */
export interface TimelineData {
  occurrences: Occurrence[];
  byMonth: number[];
  total: number;
  largestDay: number;
}

/** An item's colour on the chart, and whether it's drawn muted. */
export interface TimelineAppearance {
  accent: string;
  /** Drawn at reduced fill-opacity — variable spending, where there's a
   *  decision to make. Never set by income. */
  muted?: boolean;
}

/**
 * How a month's shade is chosen from its total. The two tools measure the year
 * differently: income against the year's total; spending against the gap
 * between its lightest and heaviest month — spending rarely goes near zero, so
 * measured from zero the whole year lands in the top of the range and the band
 * reads as twelve identical blocks.
 */
export type BandScale =
  | { kind: "share" }
  | { kind: "range"; low: number; high: number };

/** Everything a page hands the shared timeline, orientation aside. */
export interface TimelineProps {
  year: number;
  data: TimelineData;
  /** An item's colour and muting, by id. Memoize on the page side. */
  appearance: (itemId: string) => TimelineAppearance;
  /** An item's display name, by id, with the caller's own fallback for an item
   *  deleted mid-hover. Memoize on the page side. */
  nameOf: (itemId: string) => string;
  /** The one line of the detail card that differs between the tools. */
  describe: (itemId: string) => ReactNode;
  /** Plural noun for "N sources" / "N expenses" on a shared day. */
  peerNoun: { one: string; many: string };
  /** Shown when the year is empty. */
  emptyMessage: string;
  /** Band tint: var(--jade) for income, var(--crimson) for spending. */
  bandColor: string;
  bandScale: BandScale;
  /** For the SVG's aria-label: "Expenses across 2026". */
  title: string;

  zoomMonth: number | null;
  onZoomMonth: (month: number | null) => void;
  hoveredItemId: string | null;
  onHoverItem: (id: string | null) => void;
  duration: number;
}
