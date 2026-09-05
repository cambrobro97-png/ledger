"use client";

import { MonthTicks } from "./MonthTicks";
import styles from "./HeatStrip.module.css";

export interface HeatStripProps {
  values: number[];
  color: string;
  /** Indices to ring — the heaviest and leanest months. */
  highlight?: number[];
  label: string;
}

/** The faintest a cell that spends anything gets, so it never reads as empty. */
const FLOOR = 0.24;

/**
 * A year as twelve blocks, shaded by weight.
 *
 * The one chart form on the dashboard that survives a phone intact: it needs no
 * axis, no legend, and no width to speak of, so it renders at every size rather
 * than only at the ones with room for a plot.
 */
export function HeatStrip({ values, color, highlight = [], label }: HeatStripProps) {
  const spending = values.filter((value) => value > 0);
  const peak = Math.max(0, ...spending);
  /*
   * Shaded from the leanest month to the heaviest rather than from zero.
   *
   * A year's months rarely differ by more than half, so scaling down to zero
   * leaves twelve near-identical blocks — the strip says nothing at exactly the
   * moment it should. Ranging over the data does exaggerate the spread, which
   * is why the card prints both the heaviest and the leanest figure directly
   * above: the scale is stated, not left to be inferred from the colour.
   */
  const lean = Math.min(peak, ...spending);
  const range = peak - lean;
  const marked = new Set(highlight);

  return (
    <div>
      <div className={styles.strip} role="img" aria-label={label}>
        {values.map((value, index) => (
          <div
            key={index}
            className={`${styles.cell} ${marked.has(index) ? styles.marked : ""}`}
          >
            <span
              className={styles.fill}
              style={{
                background: color,
                // A month with nothing in it stays empty; everything else
                // starts at the floor, so the leanest month is still visibly a
                // month that spent something.
                opacity:
                  value <= 0
                    ? 0
                    : range <= 0
                      ? 1
                      : FLOOR + (1 - FLOOR) * ((value - lean) / range),
              }}
            />
          </div>
        ))}
      </div>
      <MonthTicks />
    </div>
  );
}
