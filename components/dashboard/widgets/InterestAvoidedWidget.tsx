"use client";

import { useMortgageSummary } from "@/hooks/summaries/useMortgageSummary";
import { padSeries } from "@/lib/amortization";
import { formatMoney, formatPercent } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { GapChart } from "../GapChart";
import { WidgetShell } from "../WidgetShell";

/**
 * What the extra payments are worth, as the gap between two interest bills.
 *
 * The payoff widget says how much sooner; this says how much cheaper, which is
 * the figure the mortgage tool is really kept for.
 */
export function InterestAvoidedWidget({ size }: WidgetProps) {
  const { hydrated, scenarioName, baseline, current, comparison, error } = useMortgageSummary();

  const saved = comparison?.interestSaved ?? 0;
  // Below a dollar the two lines are the same line, and a shaded gap nobody can
  // see would only suggest the chart had failed to draw.
  const worthDrawing = saved >= 1;

  const detail = !current
    ? "Check the loan figures"
    : worthDrawing && comparison
      ? `${formatPercent(comparison.interestSavedShare)} of the interest you'd otherwise pay`
      : "You're on the scheduled payment";

  return (
    <WidgetShell
      eyebrow={scenarioName ? `Mortgage · ${scenarioName}` : "Mortgage"}
      title="Interest avoided"
      value={current ? formatMoney(saved) : "—"}
      detail={detail}
      accent="var(--brass)"
      hydrated={hydrated}
      note={error && current ? error : undefined}
    >
      {size === "wide" && baseline && current && worthDrawing ? (
        <GapChart
          // The scenario finishes first, so its interest series is the shorter
          // one; padding holds the final figure flat to the baseline's term
          // rather than letting the line stop mid-chart.
          upper={{ values: baseline.cumulativeInterest, color: "var(--ash)" }}
          lower={{
            values: padSeries(current.cumulativeInterest, baseline.months),
            color: "var(--brass)",
          }}
          fillFrom={0}
          fillColor="var(--jade)"
          marker={current.months}
          label="Interest paid on the scheduled payment against this scenario, with the month it is paid off marked"
        />
      ) : null}
    </WidgetShell>
  );
}
