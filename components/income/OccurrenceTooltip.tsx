"use client";

import { formatDayLong } from "@/lib/days";
import { formatMoney } from "@/lib/format";
import { CADENCE_LABELS, accentFor } from "@/lib/income";
import type { IncomeItem, Occurrence, StackedOccurrence } from "@/lib/types";
import styles from "./OccurrenceTooltip.module.css";

interface OccurrenceTooltipProps {
  occurrence: Occurrence;
  item: IncomeItem | undefined;
  year: number;
  /** Horizontal position as a percentage of the chart width. */
  left: number;
  /** Where this payment sits in its day's stack, when it shares the date. */
  stack: StackedOccurrence | undefined;
}

/** What one payment is, on hover. */
export function OccurrenceTooltip({ occurrence, item, left, stack }: OccurrenceTooltipProps) {
  // Clamped away from both edges so the card never runs off the panel, the
  // same edge-awareness the payoff marker's label uses.
  const clamped = Math.max(9, Math.min(91, left));
  const shared = stack !== undefined && stack.count > 1;

  return (
    <div
      className={styles.tip}
      style={{
        left: `${clamped}%`,
        ["--accent" as string]: accentFor(item?.accent ?? 0),
      }}
    >
      <div className={styles.name}>{item?.name || "Income"}</div>
      <div className={styles.amount}>{formatMoney(occurrence.amount)}</div>
      <div className={styles.meta}>{formatDayLong(occurrence.day)}</div>
      {item ? <div className={styles.meta}>{CADENCE_LABELS[item.cadence]}</div> : null}
      {/* One band of a column reads as the wrong number without the column
          behind it, so a shared day names its own total. */}
      {shared ? (
        <div className={styles.total}>
          {formatMoney(stack.total)} that day, across {stack.count} sources
        </div>
      ) : null}
    </div>
  );
}
