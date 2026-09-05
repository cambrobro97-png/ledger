"use client";

import { useExpenseSummary } from "@/hooks/summaries/useExpenseSummary";
import { MONTH_NAMES } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { HeatStrip } from "../HeatStrip";
import { WidgetShell } from "../WidgetShell";

/**
 * The year's shape at a glance: which months are heavy and which are lean.
 *
 * Takes no `size`: a strip of twelve blocks needs no width to speak of, so it
 * draws the same at every one.
 */
export function SpendingHeatWidget() {
  const { hydrated, year, derived } = useExpenseSummary();

  const { peakMonth, leanMonth, byMonth } = derived;
  const known = peakMonth >= 0 && leanMonth >= 0;

  return (
    <WidgetShell
      eyebrow={`Expenses · ${year}`}
      title="Heaviest month"
      value={known ? formatMoney(byMonth[peakMonth]) : "—"}
      detail={
        known
          ? `${MONTH_NAMES[peakMonth]} · leanest is ${MONTH_NAMES[leanMonth]} at ${formatMoney(byMonth[leanMonth])}`
          : "Nothing scheduled yet"
      }
      accent="var(--crimson)"
      hydrated={hydrated}
    >
      {/* Needs no width to speak of, so unlike the plots it draws at every size. */}
      {known ? (
        <HeatStrip
          values={byMonth}
          color="var(--crimson)"
          highlight={[peakMonth, leanMonth]}
          label={`Spending by month, heaviest in ${MONTH_NAMES[peakMonth]} and leanest in ${MONTH_NAMES[leanMonth]}`}
        />
      ) : null}
    </WidgetShell>
  );
}
