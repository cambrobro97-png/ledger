"use client";

import { describeScenario } from "@/lib/describeRetirement";
import { formatMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { Projection, RetirementProfile, RetirementScenario } from "@/lib/types";

interface RetirementHeroProps {
  scenario: RetirementScenario;
  profile: RetirementProfile;
  current: Projection;
  /** What a year costs on this outlook — from the expense list when it's linked. */
  annualSpend: number;
  /** Years sooner than the baseline outlook allows. Negative means later. */
  yearsEarlier: number;
}

/** The one-sentence claim the whole page exists to support. */
export function RetirementHero({
  scenario,
  profile,
  current,
  annualSpend,
  yearsEarlier,
}: RetirementHeroProps) {
  const yearsAway = Math.max(0, current.retirementAge - profile.currentAge);

  if (current.shortfall) {
    return (
      <section className="mt-[clamp(24px,3vw,44px)]">
        <div className="eyebrow">{scenario.name}</div>
        <p className="mx-0 mb-0 mt-2 font-display text-hero font-bold leading-[1.02] tracking-[-0.02em]">
          This outlook doesn&rsquo;t <span className="text-crimson">reach retirement</span>.
        </p>
        <p className="mt-3.5 max-w-[60ch] text-lg text-ash">
          Working all the way to {profile.endAge} still leaves the money short of{" "}
          {describeScenario(scenario, annualSpend)}. Saving more, spending less, or a kinder market would
          change it &mdash; the charts below show the path as it stands.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-[clamp(24px,3vw,44px)]">
      <div className="eyebrow">{scenario.name}</div>

      <p className="mx-0 mb-0 mt-2 font-display text-hero font-bold leading-[1.02] tracking-[-0.02em]">
        You can retire at <span className="text-brass">{current.retirementAge}</span>.
      </p>

      <p className="mt-3.5 max-w-[60ch] text-lg text-ash">
        That&rsquo;s {yearsAway === 0 ? "today" : `${yearsAway} years from now`}, in{" "}
        {formatMonth(current.retirementDate)}, with{" "}
        {formatMoney(current.peakBalance)} at its peak and{" "}
        {formatMoney(current.endingBalance)} still there at {profile.endAge}
        {yearsEarlier > 0
          ? ` — ${yearsEarlier} ${yearsEarlier === 1 ? "year" : "years"} sooner than the market as it stands.`
          : yearsEarlier < 0
            ? ` — ${Math.abs(yearsEarlier)} ${Math.abs(yearsEarlier) === 1 ? "year" : "years"} later than the market as it stands.`
            : "."}
      </p>
    </section>
  );
}
