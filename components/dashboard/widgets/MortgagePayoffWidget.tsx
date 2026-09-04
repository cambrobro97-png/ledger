"use client";

import { useMortgageSummary } from "@/hooks/summaries/useMortgageSummary";
import { formatDuration, formatMoney } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { Sparkline } from "../Sparkline";
import { WidgetShell } from "../WidgetShell";

/** How long the mortgage has left on whichever scenario the tool has selected. */
export function MortgagePayoffWidget({ size }: WidgetProps) {
  const { hydrated, scenarioName, current, comparison, error } = useMortgageSummary();

  const value = current ? formatDuration(current.months) : "—";

  const detail = !current
    ? "Check the loan figures"
    : comparison && comparison.monthsSaved > 0
      ? `${formatDuration(comparison.monthsSaved)} sooner — saving ${formatMoney(comparison.interestSaved)}`
      : "The path you're on today";

  return (
    <WidgetShell
      eyebrow={scenarioName ? `Mortgage · ${scenarioName}` : "Mortgage"}
      title="Payoff"
      value={value}
      detail={detail}
      accent="var(--brass)"
      hydrated={hydrated}
      note={error && current ? error : undefined}
    >
      {size === "wide" && current ? (
        <Sparkline
          label="Balance falling to zero"
          series={[{ values: current.balances, color: "var(--brass)", fill: true }]}
        />
      ) : null}
    </WidgetShell>
  );
}
