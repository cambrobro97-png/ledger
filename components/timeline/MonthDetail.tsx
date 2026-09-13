"use client";

import { cn } from "@/lib/cn";
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
    <div className={cn(styles.wrap, "mt-[clamp(16px,1.8vw,26px)] border-t border-rule pt-[clamp(14px,1.5vw,22px)]")}>
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-label uppercase tracking-[0.18em] text-ash">
            {MONTH_NAMES[month]} {year}
          </div>
          <div className="mt-1.5 font-mono text-figure leading-[1.1] tabular-nums tracking-[-0.02em]">{formatMoney(total)}</div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-ash">{total > 0 ? stats : null}</div>
      </div>

      {lines.length > 0 ? (
        <ul className="m-0 grid list-none gap-0.5 p-0">
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
                className={cn(
                  "group grid items-center gap-3 rounded-control px-2.5 py-[9px]",
                  "[grid-template-columns:10px_minmax(0,1.6fr)_minmax(60px,1fr)_auto]",
                  // The share bar is the first thing to go on a phone: the
                  // amount and its percentage already carry the comparison.
                  "max-md:[grid-template-columns:10px_minmax(0,1fr)_auto]",
                  "transition-[background-color,opacity] duration-(--tween) ease-tween hover:bg-panel-2",
                  dimmed && "opacity-35",
                )}
                style={{ ["--accent" as string]: appearance(line.itemId).accent }}
                onPointerEnter={() => onHoverItem(line.itemId)}
                onPointerLeave={() => onHoverItem(null)}
              >
                <span className="size-[9px] rounded-full bg-[var(--accent,var(--ash))]" aria-hidden="true" />

                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-body">{line.name}</span>
                  <span className="truncate text-label text-ash">{describe(line.itemId, datesSummary)}</span>
                </span>

                {/* The share bar makes the month readable as a composition
                    rather than a column of numbers to compare by eye. */}
                <span
                  className="h-[5px] overflow-hidden rounded-[3px] bg-panel-2 group-hover:bg-[rgba(134,152,174,0.18)] max-md:hidden"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full rounded-[3px] bg-[var(--accent,var(--ash))] transition-[width] duration-(--tween) ease-tween" style={{ width: `${share * 100}%` }} />
                </span>

                <span className="flex items-baseline gap-2 font-mono text-body tabular-nums">
                  {formatMoney(line.total)}
                  <span className="min-w-[4ch] text-right text-label text-ash">{formatPercent(share)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 text-body text-ash">Nothing lands in {MONTH_NAMES[month]}.</p>
      )}
    </div>
  );
}
