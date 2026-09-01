"use client";

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
