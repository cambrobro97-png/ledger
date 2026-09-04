"use client";

import { useExpenseSummary } from "@/hooks/summaries/useExpenseSummary";
import { useIncomeSummary } from "@/hooks/summaries/useIncomeSummary";
import { formatMoney } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { Sparkline } from "../Sparkline";
import { WidgetShell } from "../WidgetShell";

/**
 * Income against spending — the one figure no single tool can show, and the
 * reason the dashboard earns its place.
 */
export function CashFlowWidget({ size }: WidgetProps) {
  const income = useIncomeSummary();
  const expenses = useExpenseSummary();

  const hydrated = income.hydrated && expenses.hydrated;
  const net = income.derived.total - expenses.derived.total;
  const kept = net >= 0;

  // The two tools carry their own year, and nothing keeps them in step. Quietly
  // subtracting one year's spending from another year's income is the one
  // genuinely wrong answer this widget could give, so the mismatch is said out
  // loud rather than hidden.
  const mismatched = income.year !== expenses.year;

  return (
    <WidgetShell
      eyebrow={`Income vs spending · ${income.year}`}
      title="Cash flow"
      value={formatMoney(Math.abs(net))}
      detail={`${formatMoney(Math.abs(net) / 12)} a month ${kept ? "kept" : "short"}`}
      accent={kept ? "var(--jade)" : "var(--crimson)"}
      hydrated={hydrated}
      note={mismatched ? `Spending shown for ${expenses.year}` : undefined}
    >
      {size !== "small" ? (
        <Sparkline
          // Both series share one derived range — that is what makes the gap
          // between the lines mean something. No explicit `max`: rounding the
          // ceiling up to a "nice" number would flatten both lines into the
          // bottom of the box, since neither series comes near zero.
          label="Income against spending, by month"
          series={[
            { values: expenses.derived.byMonth, color: "var(--crimson)", fill: true },
            { values: income.derived.byMonth, color: "var(--jade)" },
          ]}
        />
      ) : null}
    </WidgetShell>
  );
}
