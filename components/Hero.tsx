"use client";

import { describeExtras } from "@/lib/describe";
import { formatDuration } from "@/lib/format";
import { formatMonth } from "@/lib/dates";
import type { Amortization, Scenario } from "@/lib/types";

interface HeroProps {
  scenario: Scenario;
  baseline: Amortization;
  current: Amortization;
  monthsSaved: number;
}

/** The one-sentence claim the whole page exists to support. */
export function Hero({ scenario, baseline, current, monthsSaved }: HeroProps) {
  const onBaselinePath = monthsSaved <= 0;

  return (
    <section className="mt-[clamp(24px,3vw,44px)]">
      <div className="eyebrow">{scenario.name}</div>

      <p className="mx-0 mt-2 mb-0 font-display text-hero leading-[1.02] font-bold tracking-[-0.02em]">
        The house is yours in <span className="text-brass">{formatDuration(current.months)}</span>.
      </p>

      {onBaselinePath ? (
        <p className="mt-3.5 max-w-[60ch] text-lg text-ash">
          This is the path you&rsquo;re on today, and every other scenario is measured against it.
        </p>
      ) : (
        <p className="mt-3.5 max-w-[60ch] text-lg text-ash">
          Adding {describeExtras(scenario)} moves the last payment from{" "}
          {formatMonth(baseline.payoffDate)} to {formatMonth(current.payoffDate)} &mdash;{" "}
          {formatDuration(monthsSaved)} sooner.
        </p>
      )}
    </section>
  );
}
