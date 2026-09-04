"use client";

import { useRetirementSummary } from "@/hooks/summaries/useRetirementSummary";
import { formatMoney } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { Sparkline } from "../Sparkline";
import { WidgetShell } from "../WidgetShell";

/** The earliest age the money still lasts on the selected outlook. */
export function RetirementAgeWidget({ size }: WidgetProps) {
  const { hydrated, outlookName, endAge, current } = useRetirementSummary();

  // A shortfall means no retirement age worked, so `retirementAge` holds a
  // fallback rather than an answer. Showing it would be a confident wrong
  // number, which is worse than an em-dash.
  const unusable = !current || current.shortfall;

  return (
    <WidgetShell
      eyebrow={outlookName ? `Retirement · ${outlookName}` : "Retirement"}
      title="Stop working at"
      value={unusable ? "—" : String(current.retirementAge)}
      detail={
        unusable
          ? "No age works on this outlook"
          : `${formatMoney(current.endingBalance)} left at ${endAge}`
      }
      accent="var(--jade)"
      hydrated={hydrated}
    >
      {size === "wide" && !unusable ? (
        <Sparkline
          label="Portfolio balance over time"
          series={[{ values: current.balances, color: "var(--jade)", fill: true }]}
        />
      ) : null}
    </WidgetShell>
  );
}
