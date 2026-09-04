"use client";

import { useExpenseSummary } from "@/hooks/summaries/useExpenseSummary";
import { formatMoney } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { Sparkline } from "../Sparkline";
import { WidgetShell } from "../WidgetShell";

/** What the year's bills come to. */
export function ExpensesYearWidget({ size }: WidgetProps) {
  const { hydrated, year, derived } = useExpenseSummary();

  return (
    <WidgetShell
      eyebrow={`Expenses · ${year}`}
      title="Spending"
      value={formatMoney(derived.total)}
      detail={`${formatMoney(derived.total / 12)} a month · ${formatMoney(derived.fixedTotal)} fixed`}
      accent="var(--crimson)"
      hydrated={hydrated}
    >
      {size !== "small" ? (
        <Sparkline
          label="Spending by month"
          series={[{ values: derived.byMonth, color: "var(--crimson)", fill: true }]}
        />
      ) : null}
    </WidgetShell>
  );
}
