"use client";

import { MONTH_NAMES } from "@/lib/dates";

/**
 * Twelve initials under a twelve-column chart.
 *
 * `aria-hidden`: the chart above already carries a written label naming the
 * months that matter, and a screen reader reading out "J F M A M J J A S O N D"
 * would be noise, not an axis.
 */
export function MonthTicks() {
  return (
    <div className="mt-[5px] flex gap-[3px]" aria-hidden="true">
      {MONTH_NAMES.map((name, index) => (
        <span key={index} className="min-w-0 flex-1 text-center font-mono text-micro tracking-[0.04em] text-ash opacity-70">
          {name.slice(0, 1)}
        </span>
      ))}
    </div>
  );
}
