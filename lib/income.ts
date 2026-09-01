import {
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
