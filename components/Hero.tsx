"use client";

import { describeExtras } from "@/lib/describe";
import { formatDuration } from "@/lib/format";
import { formatMonth } from "@/lib/dates";
import type { Amortization, Scenario } from "@/lib/types";
import styles from "./Hero.module.css";

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
    <section className={styles.hero}>
      <div className={styles.eyebrow}>{scenario.name}</div>

      <p className={styles.verdict}>
        The house is yours in{" "}
        <span className={styles.highlight}>
          {formatDuration(current.months)}
        </span>
        .
      </p>

      {onBaselinePath ? (
        <p className={styles.sub}>
          This is the path you&rsquo;re on today, and every other scenario is
          measured against it.
        </p>
      ) : (
        <p className={styles.sub}>
          Adding {describeExtras(scenario)} moves the last payment from{" "}
          {formatMonth(baseline.payoffDate)} to{" "}
          {formatMonth(current.payoffDate)} &mdash;{" "}
          {formatDuration(monthsSaved)} sooner.
        </p>
      )}
    </section>
  );
}
