"use client";

import { useMemo } from "react";
import { MONTH_NAMES } from "@/lib/dates";
import { formatDay } from "@/lib/days";
import { formatMoney, formatPercent } from "@/lib/format";
import { CATEGORY_LABELS, categoryAccent } from "@/lib/expenses";
import type { ExpenseItem, ExpenseYear } from "@/lib/types";
import styles from "./MonthDetail.module.css";

interface MonthDetailProps {
  month: number;
  year: number;
  derived: ExpenseYear;
  items: ExpenseItem[];
  hoveredItemId: string | null;
  onHoverItem: (id: string | null) => void;
}

/** One line of the open month: a payment, or several from the same bill. */
interface MonthLine {
  itemId: string;
  name: string;
  category: ExpenseItem["category"];
  kind: ExpenseItem["kind"];
  total: number;
  /** Every date this bill lands on in the month, in order. */
  dates: string[];
}

/**
 * What an open month actually contains, listed out. The timeline says when the
 * money leaves and roughly how much; this says what each column was for.
 */
export function MonthDetail({
  month,
  year,
  derived,
  items,
  hoveredItemId,
  onHoverItem,
}: MonthDetailProps) {
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  // Grouped by bill rather than listed per payment: groceries four times over
  // is one line of the budget, not four things to read.
  const lines = useMemo(() => {
    const grouped = new Map<string, MonthLine>();

    for (const occurrence of derived.occurrences) {
      if (occurrence.day.month !== month) continue;
      const item = itemsById.get(occurrence.itemId);
      if (!item) continue;

      const existing = grouped.get(occurrence.itemId);
      if (existing) {
        existing.total += occurrence.amount;
        existing.dates.push(formatDay(occurrence.day));
      } else {
        grouped.set(occurrence.itemId, {
          itemId: occurrence.itemId,
          name: item.name || "Expense",
          category: item.category,
          kind: item.kind,
          total: occurrence.amount,
          dates: [formatDay(occurrence.day)],
        });
      }
    }

    // Biggest first: the month's shape is a question of what dominates it.
    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }, [derived.occurrences, month, itemsById]);

  const total = derived.byMonth[month];
  const fixed = lines.reduce((sum, line) => (line.kind === "fixed" ? sum + line.total : sum), 0);

  // Measured against the months that actually spend, so a half-filled year
  // doesn't make every month look above average.
  const spendingMonths = derived.byMonth.filter((amount) => amount > 0).length;
  const average = spendingMonths === 0 ? 0 : derived.total / spendingMonths;
  const delta = total - average;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>
            {MONTH_NAMES[month]} {year}
          </div>
          <div className={styles.total}>{formatMoney(total)}</div>
        </div>

        <div className={styles.summary}>
          {total > 0 ? (
            <>
              <span className={styles.stat}>
                <strong>{formatMoney(fixed)}</strong> fixed
              </span>
              <span className={styles.stat}>
                <strong>{formatMoney(total - fixed)}</strong> variable
              </span>
              <span
                className={`${styles.stat} ${delta > 0 ? styles.over : styles.under}`}
                title="Against the average month that has spending in it"
              >
                <strong>
                  {delta >= 0 ? "+" : "−"}
                  {formatMoney(Math.abs(delta))}
                </strong>{" "}
                vs. average
              </span>
            </>
          ) : null}
        </div>
      </div>

      {lines.length > 0 ? (
        <ul className={styles.list}>
          {lines.map((line) => {
            const share = total > 0 ? line.total / total : 0;
            const dimmed = hoveredItemId !== null && hoveredItemId !== line.itemId;

            return (
              <li
                key={line.itemId}
                className={`${styles.line} ${dimmed ? styles.lineDim : ""}`}
                style={{ ["--accent" as string]: categoryAccent(line.category) }}
                onPointerEnter={() => onHoverItem(line.itemId)}
                onPointerLeave={() => onHoverItem(null)}
              >
                <span className={styles.dot} aria-hidden="true" />

                <span className={styles.body}>
                  <span className={styles.name}>{line.name}</span>
                  <span className={styles.meta}>
                    {CATEGORY_LABELS[line.category]}
                    {line.kind === "variable" ? " · variable" : ""}
                    {" · "}
                    {line.dates.length > 1
                      ? `${line.dates.length} payments — ${line.dates.join(", ")}`
                      : line.dates[0]}
                  </span>
                </span>

                {/* The share bar makes the month readable as a composition
                    rather than a column of numbers to compare by eye. */}
                <span className={styles.bar} aria-hidden="true">
                  <span className={styles.fill} style={{ width: `${share * 100}%` }} />
                </span>

                <span className={styles.amount}>
                  {formatMoney(line.total)}
                  <span className={styles.share}>{formatPercent(share)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>Nothing lands in {MONTH_NAMES[month]}.</p>
      )}
    </div>
  );
}
