"use client";

import { MetricCard, MetricGrid } from "@/components/MetricCard";
import { useTweenedNumber } from "@/hooks/useTween";
import { MONTH_NAMES } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { IncomeYear } from "@/lib/types";

interface IncomeMetricsProps {
  year: number;
  derived: IncomeYear;
  sourceCount: number;
  duration: number;
}

/** The year's headline figures, counting into place as the list changes. */
export function IncomeMetrics({ year, derived, sourceCount, duration }: IncomeMetricsProps) {
  const total = useTweenedNumber(derived.total, duration);
  const average = useTweenedNumber(derived.total / 12, duration);
  const peakValue = useTweenedNumber(
    derived.peakMonth === -1 ? 0 : derived.byMonth[derived.peakMonth],
    duration,
  );

  return (
    <MetricGrid>
      <MetricCard
        label={`Gross ${year}`}
        value={formatMoney(total)}
        detail={
          <>
            across <strong>{derived.occurrences.length}</strong>{" "}
            {derived.occurrences.length === 1 ? "payment" : "payments"}
          </>
        }
        accent="var(--jade)"
      />
      <MetricCard
        label="Average month"
        value={formatMoney(average)}
        detail="gross, before tax and deductions"
        accent="var(--brass)"
      />
      <MetricCard
        label="Biggest month"
        value={derived.peakMonth === -1 ? "—" : formatMoney(peakValue)}
        detail={
          derived.peakMonth === -1 ? (
            "nothing scheduled"
          ) : (
            <>
              <strong>{MONTH_NAMES[derived.peakMonth]}</strong> — the extra payday
            </>
          )
        }
        accent="#5aa9e6"
      />
      <MetricCard
        label="Sources"
        value={String(sourceCount)}
        detail={sourceCount === 1 ? "one line of income" : "lines of income"}
        accent="#b48ce0"
      />
    </MetricGrid>
  );
}
