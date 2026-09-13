"use client";

import { cn } from "@/lib/cn";
import { isMonthValue, monthsBetween, parseMonth } from "@/lib/dates";
import type { Projection, RetirementProfile } from "@/lib/types";
import styles from "./AgeRibbon.module.css";

interface AgeRibbonProps {
  profile: RetirementProfile;
  current: Projection;
}

/**
 * The whole life in one bar: years still working in jade, years living off the
 * balance hatched in brass, with the age you cross over marked between them.
 */
export function AgeRibbon({ profile, current }: AgeRibbonProps) {
  const span = Math.max(1, profile.endAge - profile.currentAge);
  const workingShare = Math.max(0, Math.min(1, current.retirementYearIndex / span)) * 100;
  const gridLines = Math.max(1, Math.round(span / 10));

  /*
   * Where the mortgage ends, against the same span. Which side of the
   * retirement line it falls on is the whole question — a loan that outlives
   * the last paycheque is a very different plan from one that doesn't — and
   * until now the two dates were only ever shown apart from each other.
   *
   * Left off entirely when it lands outside the ribbon: a payoff already behind
   * you, or past the age the money has to last to, has nothing to mark.
   */
  const payoffYears =
    isMonthValue(profile.mortgagePayoff) && isMonthValue(profile.start)
      ? monthsBetween(parseMonth(profile.start), parseMonth(profile.mortgagePayoff)) / 12
      : null;
  const payoffShare =
    payoffYears !== null && payoffYears > 0 && payoffYears < span
      ? (payoffYears / span) * 100
      : null;
  const payoffAge = payoffYears === null ? 0 : Math.round(profile.currentAge + payoffYears);

  return (
    <div className="mt-[clamp(26px,3vw,42px)]">
      <div className="relative h-[clamp(46px,4.2vw,74px)] overflow-hidden rounded-xl border border-rule bg-panel">
        <div className={styles.working} style={{ width: `${workingShare}%` }} />
        <div className={styles.retired} style={{ width: `${100 - workingShare}%` }} />
        <div className={styles.scale}>
          {Array.from({ length: gridLines }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        {payoffShare === null ? null : (
          <div
            className={styles.payoff}
            style={{ left: `${payoffShare}%` }}
            title={`Mortgage paid off at ${payoffAge}`}
          >
            <span
              className={cn("absolute bottom-1 whitespace-nowrap rounded bg-ink px-[5px] py-px font-mono text-micro tracking-[0.04em] text-ash", payoffShare > 70 ? "right-[5px]" : "left-[5px]")}
            >
              mortgage ends {payoffAge}
            </span>
          </div>
        )}

        <div className="absolute inset-y-0 flex items-center px-3.5 font-mono text-base text-bone">
          {current.retirementYearIndex > 0 ? `${current.retirementYearIndex} more working` : ""}
        </div>
        <div className="absolute inset-y-0 flex items-center px-3.5 font-mono text-base text-bone right-0 justify-end text-brass">
          {current.shortfall
            ? ""
            : `${profile.endAge - current.retirementAge} retired`}
        </div>
      </div>

      <div className="mt-2.5 flex justify-between gap-3 font-mono text-base text-ash">
        <span>{profile.currentAge} today</span>
        <span className="text-center text-brass">
          {current.shortfall ? "never retires on this outlook" : `retire at ${current.retirementAge}`}
        </span>
        <span>
          {current.depletionAge !== null
            ? `money gone at ${current.depletionAge}`
            : `${profile.endAge} and still funded`}
        </span>
      </div>
    </div>
  );
}
