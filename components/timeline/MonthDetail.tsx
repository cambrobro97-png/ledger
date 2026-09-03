"use client";

import { useMemo, type ReactNode } from "react";
import { MONTH_NAMES } from "@/lib/dates";
import { formatDay } from "@/lib/days";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Occurrence } from "@/lib/types";
import type { TimelineAppearance } from "./types";
import styles from "./MonthDetail.module.css";

/** One line of the open month: a payment, or several from the same item. */
interface MonthLine {
  itemId: string;
  name: string;
  total: number;
  /** Every date this item lands on in the month, in order. */
  dates: string[];
}

interface MonthDetailProps {
  month: number;
  year: number;
  occurrences: Occurrence[];
  /** The month's total, from the derived year. */
  total: number;
  /** An item's colour, by id. */
  appearance: (itemId: string) => TimelineAppearance;
  /** An item's display name, by id, with a fallback. */
  nameOf: (itemId: string) => string;
  /** The meta line under each name — category · kind for expenses, cadence for
   *  income. Takes the item id and its dates-in-month summary. */
  describe: (itemId: string, datesSummary: string) => ReactNode;
  /** The header's per-tool stats slot: fixed/variable/vs-average for expenses,
   *  a payment count and vs-average for income. */
  stats: ReactNode;
  hoveredItemId: string | null;
  onHoverItem: (id: string | null) => void;
}

/**
 * What an open month actually contains, listed out. The timeline says when the
 * money moves and roughly how much; this says what each column was for. Shared
 * by both tools — the grouping and lines are domain-free; the header stats and
 * the meta line are supplied per tool.
 */
export function MonthDetail({
  month,
  year,
  occurrences,
  total,
  appearance,
  nameOf,
  describe,
  stats,
  hoveredItemId,
  onHoverItem,
}: MonthDetailProps) {
  // Grouped by item rather than listed per payment: a bill four times over is
  // one line, not four things to read.
  const lines = useMemo(() => {
    const grouped = new Map<string, MonthLine>();

    for (const occurrence of occurrences) {
      if (occurrence.day.month !== month) continue;
      const existing = grouped.get(occurrence.itemId);
      if (existing) {
        existing.total += occurrence.amount;
        existing.dates.push(formatDay(occurrence.day));
      } else {
        grouped.set(occurrence.itemId, {
          itemId: occurrence.itemId,
          name: nameOf(occurrence.itemId),
          total: occurrence.amount,
          dates: [formatDay(occurrence.day)],
        });
      }
    }

    // Biggest first: the month's shape is a question of what dominates it.
    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }, [occurrences, month, nameOf]);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>
            {MONTH_NAMES[month]} {year}
          </div>
          <div className={styles.total}>{formatMoney(total)}</div>
        </div>

        <div className={styles.summary}>{total > 0 ? stats : null}</div>
      </div>

      {lines.length > 0 ? (
        <ul className={styles.list}>
          {lines.map((line) => {
            const share = total > 0 ? line.total / total : 0;
            const dimmed = hoveredItemId !== null && hoveredItemId !== line.itemId;
            const datesSummary =
              line.dates.length > 1
                ? `${line.dates.length} payments — ${line.dates.join(", ")}`
                : line.dates[0];

            return (
              <li
                key={line.itemId}
                className={`${styles.line} ${dimmed ? styles.lineDim : ""}`}
                style={{ ["--accent" as string]: appearance(line.itemId).accent }}
                onPointerEnter={() => onHoverItem(line.itemId)}
                onPointerLeave={() => onHoverItem(null)}
              >
                <span className={styles.dot} aria-hidden="true" />

                <span className={styles.body}>
                  <span className={styles.name}>{line.name}</span>
                  <span className={styles.meta}>{describe(line.itemId, datesSummary)}</span>
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
