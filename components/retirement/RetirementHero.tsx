"use client";

import { describeScenario } from "@/lib/describeRetirement";
import { formatMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { Projection, RetirementProfile, RetirementScenario } from "@/lib/types";
import styles from "./RetirementHero.module.css";

interface RetirementHeroProps {
  scenario: RetirementScenario;
  profile: RetirementProfile;
  current: Projection;
  /** Years sooner than the baseline outlook allows. Negative means later. */
  yearsEarlier: number;
}

/** The one-sentence claim the whole page exists to support. */
export function RetirementHero({
  scenario,
  profile,
  current,
  yearsEarlier,
}: RetirementHeroProps) {
  const yearsAway = Math.max(0, current.retirementAge - profile.currentAge);

  if (current.shortfall) {
    return (
      <section className={styles.hero}>
        <div className={styles.eyebrow}>{scenario.name}</div>
        <p className={styles.verdict}>
          This outlook doesn&rsquo;t <span className={styles.shortfall}>reach retirement</span>.
        </p>
        <p className={styles.sub}>
          Working all the way to {profile.endAge} still leaves the money short of{" "}
          {describeScenario(scenario)}. Saving more, spending less, or a kinder market would
          change it &mdash; the charts below show the path as it stands.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.hero}>
      <div className={styles.eyebrow}>{scenario.name}</div>

      <p className={styles.verdict}>
        You can retire at <span className={styles.highlight}>{current.retirementAge}</span>.
      </p>

      <p className={styles.sub}>
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
