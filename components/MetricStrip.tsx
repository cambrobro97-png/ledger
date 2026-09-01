"use client";

import { addMonths, formatMonth, parseMonth } from "@/lib/dates";
import {
  formatDuration,
  formatMoney,
  formatMoneyPrecise,
  formatPercent,
} from "@/lib/format";
import { useTweenedNumber } from "@/hooks/useTween";
import type { Amortization, Comparison } from "@/lib/types";
import { MetricCard, MetricGrid } from "./MetricCard";

interface MetricStripProps {
  startMonth: string;
  baseline: Amortization;
  current: Amortization;
  comparison: Comparison;
  duration: number;
}

/** The four headline figures, each counting into place when a scenario changes. */
export function MetricStrip({
  startMonth,
  baseline,
  current,
  comparison,
  duration,
}: MetricStripProps) {
  const start = parseMonth(startMonth);
  const monthsPaid = useTweenedNumber(current.months, duration);
  const interestPaid = useTweenedNumber(current.totalInterest, duration);
  const interestSaved = useTweenedNumber(comparison.interestSaved, duration);
  const extraPaid = useTweenedNumber(current.totalExtra, duration);
  const recycledPmi = current.pmi?.totalReinvested ?? 0;

  const saved = comparison.monthsSaved;

  return (
    <MetricGrid>
      <MetricCard
        accent="var(--jade)"
        label="Paid off"
        value={formatMonth(addMonths(start, Math.round(monthsPaid)))}
        detail={
          saved > 0 ? (
            <>
              <strong>{formatDuration(saved)}</strong> earlier than{" "}
              {formatMonth(baseline.payoffDate)}
            </>
          ) : (
            <>That&rsquo;s {formatDuration(baseline.months)} of payments still ahead</>
          )
        }
      />

      <MetricCard
        accent="var(--crimson)"
        label="Interest you'd still pay"
        value={formatMoney(interestPaid)}
        detail={
          saved > 0 ? (
            <>
              Down from <strong>{formatMoney(baseline.totalInterest)}</strong>
            </>
          ) : (
            <>Every dollar of it avoidable</>
          )
        }
      />

      <MetricCard
        accent="var(--brass)"
        label="Interest never paid"
        value={formatMoney(interestSaved)}
        detail={
          comparison.interestSaved > 0 ? (
            <>
              <strong>{formatPercent(comparison.interestSavedShare)}</strong> of the interest bill,
              gone
            </>
          ) : (
            <>Nothing avoided on this path</>
          )
        }
      />

      <MetricCard
        accent="var(--ash)"
        label="Extra out of pocket"
        value={formatMoney(extraPaid)}
        detail={
          current.totalExtra > 0 ? (
            <>
              Each extra dollar cancels{" "}
              <strong>{formatMoneyPrecise(comparison.savingsPerDollar)}</strong> of interest
            </>
          ) : recycledPmi > 0 ? (
            // Nothing new was spent, but the freed-up premium is still paying
            // the loan down — saying "no extra principal" would be wrong.
            <>
              <strong>{formatMoney(recycledPmi)}</strong> of freed-up PMI, none of it new spending
            </>
          ) : (
            <>No extra principal in this scenario</>
          )
        }
      />
    </MetricGrid>
  );
}
