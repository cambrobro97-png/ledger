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
    <div className="mt-[clamp(26px,3vw,42px)]">
      <div className="relative h-[clamp(46px,4.2vw,74px)] overflow-hidden rounded-xl border border-rule bg-panel">
        <div className={styles.fill} style={{ width: `${paidShare}%` }} />
        <div className={styles.saved} style={{ width: `${100 - paidShare}%` }} />
        <div className={styles.scale}>
          {Array.from({ length: gridLines }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <div className="absolute inset-y-0 flex items-center px-3.5 font-mono text-base text-bone">
          {formatMonth(current.payoffDate)}
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center justify-end px-3.5 font-mono text-base text-brass">
          {monthsSaved > 0 ? `${formatDuration(monthsSaved)} back` : ""}
        </div>
      </div>

      <div className="mt-2.5 flex justify-between gap-3 font-mono text-base text-ash">
        <span>{formatMonth(addMonths(start, 0))}</span>
        <span className="text-center text-brass">
          {monthsSaved > 0 ? `paid off ${formatMonth(current.payoffDate)}` : ""}
        </span>
        <span>{formatMonth(baseline.payoffDate)} if nothing changes</span>
      </div>
    </div>
  );
}
