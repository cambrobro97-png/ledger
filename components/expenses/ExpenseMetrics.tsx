"use client";

import { cn } from "@/lib/cn";
import { useMemo } from "react";
import { MetricCard, MetricGrid } from "@/components/MetricCard";
import { useTweenedNumber } from "@/hooks/useTween";
import { MONTH_NAMES } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";
import { CATEGORY_LABELS, categoryAccent } from "@/lib/expenses";
import type { ExpenseItem, ExpenseYear } from "@/lib/types";

interface ExpenseMetricsProps {
  year: number;
  derived: ExpenseYear;
  items: ExpenseItem[];
  duration: number;
}

/**
 * The year's headline figures, counting into place as the list changes.
 *
 * The four cards answer the questions a spending list is actually kept to
 * settle: what it costs, what a normal month looks like, how much of that is
 * beyond reach in the short term, and what the single heaviest line is.
 */
export function ExpenseMetrics({ year, derived, items, duration }: ExpenseMetricsProps) {
  const total = useTweenedNumber(derived.total, duration);

  // Averaged over the months that actually spend, so a year only half filled
  // in doesn't report a monthly figure half what it really is.
  const spendingMonths = useMemo(
    () => derived.byMonth.filter((amount) => amount > 0).length,
    [derived.byMonth],
  );
  const average = useTweenedNumber(
    spendingMonths === 0 ? 0 : derived.total / spendingMonths,
    duration,
  );

  const fixedShare = derived.total > 0 ? derived.fixedTotal / derived.total : 0;
  const fixedMonthly = useTweenedNumber(
    spendingMonths === 0 ? 0 : derived.fixedTotal / spendingMonths,
    duration,
  );

  const heaviestItem = derived.heaviest
    ? items.find((item) => item.id === derived.heaviest?.itemId)
    : undefined;
  const heaviestTotal = useTweenedNumber(derived.heaviest?.total ?? 0, duration);
  const heaviestShare = derived.total > 0 ? (derived.heaviest?.total ?? 0) / derived.total : 0;

  const swing =
    derived.peakMonth === -1 || derived.leanMonth === -1
      ? 0
      : derived.byMonth[derived.peakMonth] - derived.byMonth[derived.leanMonth];

  return (
    <>
      <MetricGrid>
        <MetricCard
          label={`Spent ${year}`}
          value={formatMoney(total)}
          detail={
            <>
              across <strong>{derived.occurrences.length}</strong>{" "}
              {derived.occurrences.length === 1 ? "payment" : "payments"}
            </>
          }
          accent="var(--crimson)"
        />
        <MetricCard
          label="Average month"
          value={formatMoney(average)}
          detail={
            derived.peakMonth === -1 ? (
              "nothing scheduled"
            ) : (
              <>
                <strong>{MONTH_NAMES[derived.peakMonth]}</strong> is the heaviest,{" "}
                <strong>{MONTH_NAMES[derived.leanMonth]}</strong> the lightest
              </>
            )
          }
          accent="var(--brass)"
        />
        <MetricCard
          label="Fixed each month"
          value={formatMoney(fixedMonthly)}
          detail={
            <>
              <strong>{formatPercent(fixedShare)}</strong> of the bill is hard to move
            </>
          }
          accent="#5aa9e6"
        />
        <MetricCard
          label="Heaviest line"
          value={heaviestItem ? formatMoney(heaviestTotal) : "—"}
          detail={
            heaviestItem ? (
              <>
                <strong>{heaviestItem.name || "Unnamed"}</strong> — {formatPercent(heaviestShare)}{" "}
                of the year
              </>
            ) : (
              "nothing scheduled"
            )
          }
          accent="#b48ce0"
        />
      </MetricGrid>

      <div className="mt-3.5 grid [grid-template-columns:minmax(0,1.55fr)_minmax(0,1fr)] gap-3.5 max-[941px]:grid-cols-1">
        <CategoryBreakdown derived={derived} />

        <div className="grid min-w-0 content-start gap-4 rounded-panel border border-rule bg-panel p-panel">
          <Note
            label="Repeating bills"
            value={formatMoney(derived.recurringAnnual)}
            hint="a full year of every recurring line, one-offs excluded"
          />
          <Note
            label="Discretionary"
            value={formatMoney(derived.variableTotal)}
            hint={
              derived.total > 0
                ? `${formatPercent(derived.variableTotal / derived.total)} of spending you could revisit`
                : "nothing scheduled"
            }
          />
          <Note
            label="Month-to-month swing"
            value={formatMoney(swing)}
            hint={
              derived.peakMonth === -1
                ? "nothing scheduled"
                : `between ${MONTH_NAMES[derived.leanMonth]} and ${MONTH_NAMES[derived.peakMonth]}`
            }
          />
        </div>
      </div>
    </>
  );
}

function Note({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <div className="font-mono text-label tracking-[0.16em] text-ash uppercase">{label}</div>
      <div className="mt-[5px] font-mono text-amount leading-[1.15] tracking-title tabular-nums">
        {value}
      </div>
      <div className="mt-[3px] text-sm text-ash">{hint}</div>
    </div>
  );
}

/** Where the year's money goes, as one bar the categories share. */
function CategoryBreakdown({ derived }: { derived: ExpenseYear }) {
  if (derived.byCategory.length === 0) {
    return (
      <div className="min-w-0 rounded-panel border border-rule bg-panel p-panel">
        <div className="font-mono text-label tracking-[0.16em] text-ash uppercase">
          Where it goes
        </div>
        <p className="mx-0 mt-3.5 mb-0 text-base text-ash">Add an expense to see the split.</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-panel border border-rule bg-panel p-panel">
      <div className="font-mono text-label tracking-[0.16em] text-ash uppercase">Where it goes</div>

      <div className="mt-3.5 flex h-3 overflow-hidden rounded-md bg-panel-2">
        {derived.byCategory.map(({ category, total }, index) => (
          <span
            key={category}
            className={cn(
              "block h-full transition-[width] duration-(--tween) ease-tween",
              // A hairline between segments, so two neighbouring categories of
              // similar colour still read as two.
              index > 0 && "shadow-[inset_1px_0_0_var(--panel)]",
            )}
            style={{
              width: `${(total / derived.total) * 100}%`,
              background: categoryAccent(category),
            }}
            title={`${CATEGORY_LABELS[category]} — ${formatMoney(total)}`}
          />
        ))}
      </div>

      <ul className="m-0 mt-4 grid list-none [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))] gap-[7px] p-0">
        {derived.byCategory.map(({ category, total }) => (
          <li
            key={category}
            className="grid grid-cols-[9px_minmax(0,1fr)_auto_auto] items-center gap-[9px] text-base"
          >
            <span
              className="size-[9px] rounded-full"
              style={{ background: categoryAccent(category) }}
              aria-hidden="true"
            />
            <span className="truncate text-bone">{CATEGORY_LABELS[category]}</span>
            <span className="font-mono text-bone tabular-nums">{formatMoney(total)}</span>
            <span className="min-w-[4ch] text-right font-mono text-ash tabular-nums">
              {formatPercent(total / derived.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
