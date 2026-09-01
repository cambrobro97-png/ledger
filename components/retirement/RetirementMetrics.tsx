"use client";

import { formatMoney } from "@/lib/format";
import { useTweenedNumber } from "@/hooks/useTween";
import type { Projection, RetirementComparison, RetirementProfile } from "@/lib/types";
import { MetricCard, MetricGrid } from "../MetricCard";

interface RetirementMetricsProps {
  profile: RetirementProfile;
  baseline: Projection;
  current: Projection;
  comparison: RetirementComparison;
  duration: number;
}

/** The four headline figures, each counting into place when an outlook changes. */
export function RetirementMetrics({
  profile,
  baseline,
  current,
  comparison,
  duration,
}: RetirementMetricsProps) {
  const age = useTweenedNumber(current.retirementAge, duration);
  const peak = useTweenedNumber(current.peakBalance, duration);
  const match = useTweenedNumber(current.totalMatch, duration);
  const ending = useTweenedNumber(current.endingBalance, duration);

  const { yearsEarlier } = comparison;
  const runsDry = current.endingBalance <= 0.5;

  return (
    <MetricGrid>
      <MetricCard
        accent="var(--jade)"
        label="You can stop working at"
        value={current.shortfall ? "—" : String(Math.round(age))}
        detail={
          current.shortfall ? (
            <>No age works on this outlook</>
          ) : yearsEarlier > 0 ? (
            <>
              <strong>
                {yearsEarlier} {yearsEarlier === 1 ? "year" : "years"}
              </strong>{" "}
              sooner than the market as it stands
            </>
          ) : yearsEarlier < 0 ? (
            <>
              <strong>
                {Math.abs(yearsEarlier)} {Math.abs(yearsEarlier) === 1 ? "year" : "years"}
              </strong>{" "}
              later than the market as it stands
            </>
          ) : (
            <>Same as the market as it stands, at {baseline.retirementAge}</>
          )
        }
      />

      <MetricCard
        accent="var(--brass)"
        label="Peak balance"
        value={formatMoney(peak)}
        detail={
          <>
            Grown by <strong>{formatMoney(current.totalGrowth)}</strong> over the whole run
          </>
        }
      />

      <MetricCard
        accent="var(--jade)"
        label="Employer match collected"
        value={formatMoney(match)}
        detail={
          current.totalMatch > 0 ? (
            <>
              On top of <strong>{formatMoney(current.totalContributed)}</strong> of your own
            </>
          ) : (
            <>No 401(k) match on these accounts</>
          )
        }
      />

      <MetricCard
        accent={runsDry ? "var(--crimson)" : "var(--ash)"}
        label={`Left at ${profile.endAge}`}
        value={formatMoney(ending)}
        detail={
          current.depletionAge !== null ? (
            <>
              Runs dry at <strong>{current.depletionAge}</strong>
            </>
          ) : comparison.balanceDelta !== 0 ? (
            <>
              <strong>{formatMoney(Math.abs(comparison.balanceDelta))}</strong>{" "}
              {comparison.balanceDelta > 0 ? "more" : "less"} than the market as it stands
            </>
          ) : (
            <>The money outlasts the plan</>
          )
        }
      />
    </MetricGrid>
  );
}
