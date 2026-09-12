"use client";

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
    <div className={styles.ribbon}>
      <div className={styles.track}>
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
              className={`${styles.payoffLabel} ${payoffShare > 70 ? styles.payoffLabelLeft : ""}`}
            >
              mortgage ends {payoffAge}
            </span>
          </div>
        )}

        <div className={styles.cap}>
          {current.retirementYearIndex > 0 ? `${current.retirementYearIndex} more working` : ""}
        </div>
        <div className={`${styles.cap} ${styles.capRight}`}>
          {current.shortfall
            ? ""
            : `${profile.endAge - current.retirementAge} retired`}
        </div>
      </div>

      <div className={styles.labels}>
        <span>{profile.currentAge} today</span>
        <span className={styles.middle}>
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
