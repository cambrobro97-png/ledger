"use client";

import { useExpenseSummary } from "@/hooks/summaries/useExpenseSummary";
import { useRetirementSummary } from "@/hooks/summaries/useRetirementSummary";
import { formatMoney, formatPercent } from "@/lib/format";
import { comparableSpendToday } from "@/lib/links";
import type { WidgetProps } from "@/lib/widgets";
import { WidgetShell } from "../WidgetShell";

/**
 * What a retired year is planned to cost, against what a year costs now.
 *
 * Both sides are drawn on the same rule — `countsTowardRetirement` — so the
 * comparison is real: the mortgage sits outside both, since the projection
 * carries it separately, and so does anything going into the accounts.
 */
export function RetirementSpendWidget({ size }: WidgetProps) {
  const retirement = useRetirementSummary();
  const expenses = useExpenseSummary();

  const hydrated = retirement.hydrated && expenses.hydrated;
  const planned = retirement.annualSpend;
  const today = comparableSpendToday({ items: expenses.items });

  const share = today > 0 ? planned / today : 0;
  const leaner = share < 1;

  return (
    <WidgetShell
      eyebrow={`Retirement · ${retirement.outlookName}`}
      title="A year retired"
      value={formatMoney(planned)}
      detail={
        today <= 0
          ? "Nothing on the expense list to measure it against yet"
          : `${formatPercent(share)} of the ${formatMoney(today)} a year your bills come to now`
      }
      accent={today <= 0 ? "var(--ash)" : leaner ? "var(--jade)" : "var(--brass)"}
      hydrated={hydrated}
      note={
        size === "small"
          ? undefined
          : "The mortgage sits outside both figures — the projection carries it on its own"
      }
    />
  );
}
