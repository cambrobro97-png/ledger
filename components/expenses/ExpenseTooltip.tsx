"use client";

import { formatDayLong } from "@/lib/days";
import { formatMoney } from "@/lib/format";
import { CADENCE_LABELS, CATEGORY_LABELS, KIND_LABELS, categoryAccent } from "@/lib/expenses";
import type { ExpenseItem, Occurrence, StackedOccurrence } from "@/lib/types";
import styles from "./ExpenseTooltip.module.css";

interface ExpenseTooltipProps {
  occurrence: Occurrence;
  item: ExpenseItem | undefined;
  /** Horizontal position as a percentage of the chart width. */
  left: number;
  /** Where this payment sits in its day's stack, when it shares the date. */
  stack: StackedOccurrence | undefined;
}

/** What one payment is, on hover. */
export function ExpenseTooltip({ occurrence, item, left, stack }: ExpenseTooltipProps) {
  // Clamped away from both edges so the card never runs off the panel, the
  // same edge-awareness the payoff marker's label uses.
  const clamped = Math.max(9, Math.min(91, left));
  const shared = stack !== undefined && stack.count > 1;

  return (
    <div
      className={styles.tip}
      style={{
        left: `${clamped}%`,
        ["--accent" as string]: categoryAccent(item?.category ?? "other"),
      }}
    >
      <div className={styles.name}>{item?.name || "Expense"}</div>
      <div className={styles.amount}>{formatMoney(occurrence.amount)}</div>
      <div className={styles.meta}>{formatDayLong(occurrence.day)}</div>
      {item ? (
        <div className={styles.meta}>
          {CATEGORY_LABELS[item.category]} · {KIND_LABELS[item.kind].toLowerCase()} ·{" "}
          {CADENCE_LABELS[item.cadence].toLowerCase()}
        </div>
      ) : null}
      {/* One band of a column reads as the wrong number without the column
          behind it, so a shared day names its own total. */}
      {shared ? (
        <div className={styles.total}>
          {formatMoney(stack.total)} that day, across {stack.count} expenses
        </div>
      ) : null}
    </div>
  );
}
