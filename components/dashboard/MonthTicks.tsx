"use client";

import { MONTH_NAMES } from "@/lib/dates";
import styles from "./MonthTicks.module.css";

/**
 * Twelve initials under a twelve-column chart.
 *
 * `aria-hidden`: the chart above already carries a written label naming the
 * months that matter, and a screen reader reading out "J F M A M J J A S O N D"
 * would be noise, not an axis.
 */
export function MonthTicks() {
  return (
    <div className={styles.ticks} aria-hidden="true">
      {MONTH_NAMES.map((name, index) => (
        <span key={index} className={styles.tick}>
          {name.slice(0, 1)}
        </span>
      ))}
    </div>
  );
}
