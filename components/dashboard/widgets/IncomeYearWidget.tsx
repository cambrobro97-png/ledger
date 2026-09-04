"use client";

import { useIncomeSummary } from "@/hooks/summaries/useIncomeSummary";
import { MONTH_NAMES } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { Sparkline } from "../Sparkline";
import { WidgetShell } from "../WidgetShell";

/** What the year's paydays add up to. */
export function IncomeYearWidget({ size }: WidgetProps) {
  const { hydrated, year, derived } = useIncomeSummary();

  const count = derived.occurrences.length;
  const peak =
    derived.peakMonth >= 0 ? ` · biggest ${MONTH_NAMES[derived.peakMonth]}` : "";

  return (
    <WidgetShell
      // The dashboard never advances seed data onto the clock, so the year is
      // stated rather than assumed.
      eyebrow={`Income · ${year}`}
      title="Gross income"
      value={formatMoney(derived.total)}
      detail={`Across ${count} payment${count === 1 ? "" : "s"}${peak}`}
      accent="var(--jade)"
      hydrated={hydrated}
    >
      {size !== "small" ? (
        <Sparkline
          label="Income by month"
          series={[{ values: derived.byMonth, color: "var(--jade)", fill: true }]}
        />
      ) : null}
    </WidgetShell>
  );
}
