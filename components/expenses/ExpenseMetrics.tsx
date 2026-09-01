"use client";

import { useMemo } from "react";
import { MetricCard, MetricGrid } from "@/components/MetricCard";
import { useTweenedNumber } from "@/hooks/useTween";
import { MONTH_NAMES } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";
import { CATEGORY_LABELS, categoryAccent } from "@/lib/expenses";
import type { ExpenseItem, ExpenseYear } from "@/lib/types";
import styles from "./ExpenseMetrics.module.css";

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
                <strong>{heaviestItem.name || "Unnamed"}</strong> —{" "}
                {formatPercent(heaviestShare)} of the year
              </>
            ) : (
              "nothing scheduled"
            )
          }
          accent="#b48ce0"
        />
      </MetricGrid>

      <div className={styles.strip}>
        <CategoryBreakdown derived={derived} />

        <div className={styles.notes}>
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
    <div className={styles.note}>
      <div className={styles.noteLabel}>{label}</div>
      <div className={styles.noteValue}>{value}</div>
      <div className={styles.noteHint}>{hint}</div>
    </div>
  );
}

/** Where the year's money goes, as one bar the categories share. */
function CategoryBreakdown({ derived }: { derived: ExpenseYear }) {
  if (derived.byCategory.length === 0) {
    return (
      <div className={styles.categories}>
        <div className={styles.categoriesHead}>Where it goes</div>
        <p className={styles.empty}>Add an expense to see the split.</p>
      </div>
    );
  }

  return (
    <div className={styles.categories}>
      <div className={styles.categoriesHead}>Where it goes</div>

      <div className={styles.bar}>
        {derived.byCategory.map(({ category, total }) => (
          <span
            key={category}
            className={styles.segment}
            style={{
              width: `${(total / derived.total) * 100}%`,
              background: categoryAccent(category),
            }}
            title={`${CATEGORY_LABELS[category]} — ${formatMoney(total)}`}
          />
        ))}
      </div>

      <ul className={styles.legend}>
        {derived.byCategory.map(({ category, total }) => (
          <li key={category} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{ background: categoryAccent(category) }}
              aria-hidden="true"
            />
            <span className={styles.legendName}>{CATEGORY_LABELS[category]}</span>
            <span className={styles.legendValue}>{formatMoney(total)}</span>
            <span className={styles.legendShare}>{formatPercent(total / derived.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
