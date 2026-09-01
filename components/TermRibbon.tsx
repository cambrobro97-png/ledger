"use client";

import { addMonths, formatMonth, parseMonth } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import type { Amortization } from "@/lib/types";
import styles from "./TermRibbon.module.css";

interface TermRibbonProps {
  startMonth: string;
  baseline: Amortization;
  current: Amortization;
  monthsSaved: number;
}

/**
 * The whole argument in one bar: the full term as a track, the years a
 * scenario claws back hatched in brass at the far end.
 */
export function TermRibbon({ startMonth, baseline, current, monthsSaved }: TermRibbonProps) {
  const start = parseMonth(startMonth);
  const paidShare = Math.max(0, Math.min(1, current.months / baseline.months)) * 100;
  const gridLines = Math.max(1, Math.round(baseline.months / 60));

  return (
    <div className={styles.ribbon}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${paidShare}%` }} />
        <div className={styles.saved} style={{ width: `${100 - paidShare}%` }} />
        <div className={styles.scale}>
          {Array.from({ length: gridLines }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <div className={styles.cap}>{formatMonth(current.payoffDate)}</div>
        <div className={`${styles.cap} ${styles.capRight}`}>
          {monthsSaved > 0 ? `${formatDuration(monthsSaved)} back` : ""}
        </div>
      </div>

      <div className={styles.labels}>
        <span>{formatMonth(addMonths(start, 0))}</span>
        <span className={styles.middle}>
          {monthsSaved > 0 ? `paid off ${formatMonth(current.payoffDate)}` : ""}
        </span>
        <span>{formatMonth(baseline.payoffDate)} if nothing changes</span>
      </div>
    </div>
  );
}
