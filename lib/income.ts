import {
  CADENCE_PER_YEAR,
  largestDayTotal,
  occurrencesFor,
  peakMonthOf,
  sortOccurrences,
} from "./schedule";
import type { IncomeItem, IncomeYear, Occurrence } from "./types";

/**
 * The cadence engine income shares with expenses. Re-exported here so the
 * income components keep reading their vocabulary off `lib/income`, while the
 * scheduling itself lives in one place — see `lib/schedule.ts`.
 */
export {
  ACCENTS,
  CADENCE_LABELS,
  CADENCE_ORDER,
  CADENCE_PER_YEAR,
  accentFor,
  describeCadence,
  occurrencesFor,
  stackByDay,
} from "./schedule";

/**
 * What one source pays across a full year of its own rhythm, regardless of the
 * year on screen. A one-off has no rhythm to annualise, so it counts as nothing
 * — this measures the income that comes back, not money received once. The
 * counterpart to `annualCostOf` on the expense side.
 */
export function annualIncomeOf(item: IncomeItem): number {
  const amount = Number(item.amount) || 0;
  if (amount <= 0 || item.cadence === "once") return 0;
  return amount * CADENCE_PER_YEAR[item.cadence];
}

/**
 * One pass over every item, producing everything the page draws. The timeline,
 * the month band, and the metrics all read this single derived object.
 */
export function buildYear(items: IncomeItem[], year: number): IncomeYear {
  const occurrences: Occurrence[] = [];
  const byMonth = new Array(12).fill(0);
  const bySource: { itemId: string; total: number }[] = [];
  let total = 0;
  let largest = 0;

  for (const item of items) {
    const generated = occurrencesFor(item, year);
    let sourceTotal = 0;

    for (const occurrence of generated) {
      occurrences.push(occurrence);
      byMonth[occurrence.day.month] += occurrence.amount;
      sourceTotal += occurrence.amount;
      if (occurrence.amount > largest) largest = occurrence.amount;
    }

    total += sourceTotal;
    bySource.push({ itemId: item.id, total: sourceTotal });
  }

  sortOccurrences(occurrences, items);

  return {
    occurrences,
    byMonth,
    total,
    bySource,
    peakMonth: peakMonthOf(byMonth),
    largest,
    largestDay: largestDayTotal(occurrences),
  };
}
