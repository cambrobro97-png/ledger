import {
  addDays,
  addMonthsClamped,
  compareDays,
  dayOfYear,
  daysInMonth,
  formatDay,
  formatDayValue,
  parseDay,
  toEpochDay,
} from "./days";
import { formatMoney } from "./format";
import type {
  Cadence,
  CalendarDay,
  IncomeItem,
  IncomeYear,
  Occurrence,
  StackedOccurrence,
} from "./types";

/**
 * Ceiling on how many payments one item may generate for a year. A year of
 * weekly pay is 53, so this only ever trips on a nonsense anchor — it exists
 * to keep a corrupt stored value from hanging the render, the same guard
 * `MAX_MONTHS` gives the amortization loop.
 */
const MAX_OCCURRENCES = 400;

/** Colours a source can wear, indexed by `IncomeItem.accent`. */
export const ACCENTS = ["var(--jade)", "var(--brass)", "var(--crimson)", "#5aa9e6", "#b48ce0"];

export function accentFor(index: number): string {
  return ACCENTS[((index % ACCENTS.length) + ACCENTS.length) % ACCENTS.length];
}

export const CADENCE_LABELS: Record<Cadence, string> = {
  once: "One time",
  weekly: "Weekly",
  biweekly: "Every two weeks",
  semimonthly: "Twice a month",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Twice a year",
  annual: "Once a year",
};

export const CADENCE_ORDER: Cadence[] = [
  "once",
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
];

/** Step size in days for the cadences that advance by a fixed interval. */
const DAY_STEPS: Partial<Record<Cadence, number>> = { weekly: 7, biweekly: 14 };

/** Step size in months for the cadences that advance by whole months. */
const MONTH_STEPS: Partial<Record<Cadence, number>> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

/**
 * Every payment an item makes during one calendar year.
 *
 * Generation always starts from the anchor and walks toward the year, so a
 * bi-weekly item keeps its true phase — that is what produces the occasional
 * three-paycheck month instead of a tidy two per month.
 */
export function occurrencesFor(item: IncomeItem, year: number): Occurrence[] {
  const amount = Number(item.amount) || 0;
  if (amount <= 0) return [];

  const anchor = parseDay(item.anchor, year);
  const until = item.until ? parseDay(item.until, year) : null;
  const yearStart: CalendarDay = { year, month: 0, day: 1 };
  const yearEnd: CalendarDay = { year, month: 11, day: 31 };

  const dates: CalendarDay[] = [];

  if (item.cadence === "once") {
    if (anchor.year === year) dates.push(anchor);
  } else if (DAY_STEPS[item.cadence]) {
    const step = DAY_STEPS[item.cadence] as number;
    // Jump straight to the first occurrence on or after Jan 1 rather than
    // stepping a day at a time, so an anchor decades away is still cheap.
    const offset = toEpochDay(yearStart) - toEpochDay(anchor);
    const skipped = offset > 0 ? Math.ceil(offset / step) : 0;
    let cursor = addDays(anchor, skipped * step);
    for (let guard = 0; guard < MAX_OCCURRENCES; guard += 1) {
      if (compareDays(cursor, yearEnd) > 0) break;
      dates.push(cursor);
      cursor = addDays(cursor, step);
    }
  } else if (item.cadence === "semimonthly") {
    // Two a month: the anchor's day, and the same day a fortnight later,
    // both clamped so a late anchor still lands inside short months.
    for (let month = 0; month < 12; month += 1) {
      const length = daysInMonth(year, month);
      const first = Math.min(anchor.day, length);
      const second = Math.min(anchor.day + 15, length);
      dates.push({ year, month, day: first });
      if (second !== first) dates.push({ year, month, day: second });
    }
  } else {
    const step = MONTH_STEPS[item.cadence] as number;
    const months = (year - anchor.year) * 12 - anchor.month;
    const skipped = months > 0 ? Math.ceil(months / step) : 0;
    // Always measured from the anchor, never from the last date produced: a
    // payment on the 31st that February shortens must return to the 31st in
    // March rather than dragging the clamp along behind it.
    for (let count = skipped; count < skipped + MAX_OCCURRENCES; count += 1) {
      const cursor = addMonthsClamped(anchor, count * step);
      if (cursor.year > year) break;
      if (cursor.year === year) dates.push(cursor);
    }
  }

  return dates
    .filter((date) => compareDays(date, anchor) >= 0 && (!until || compareDays(date, until) <= 0))
    .map((date) => {
      const value = formatDayValue(date);
      return {
        id: `${item.id}:${value}`,
        itemId: item.id,
        date: value,
        day: date,
        dayOfYear: dayOfYear(date),
        amount,
      };
    });
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

  // Within a day, ordered by the item's place in the list rather than by id:
  // the stack's bands are read against each other across days, so a source has
  // to keep the same position in every column it appears in.
  const order = new Map(items.map((item, index) => [item.id, index]));
  occurrences.sort(
    (a, b) =>
      a.dayOfYear - b.dayOfYear ||
      (order.get(a.itemId) ?? 0) - (order.get(b.itemId) ?? 0),
  );

  // Measured after the sort, off the finished order, so it counts the same
  // columns the timeline stacks rather than a per-item guess.
  let largestDay = 0;
  for (let index = 0; index < occurrences.length; ) {
    const day = occurrences[index].dayOfYear;
    let dayTotal = 0;
    while (index < occurrences.length && occurrences[index].dayOfYear === day) {
      dayTotal += occurrences[index].amount;
      index += 1;
    }
    if (dayTotal > largestDay) largestDay = dayTotal;
  }

  let peakMonth = -1;
  for (let month = 0; month < 12; month += 1) {
    if (byMonth[month] > 0 && (peakMonth === -1 || byMonth[month] > byMonth[peakMonth])) {
      peakMonth = month;
    }
  }

  return { occurrences, byMonth, total, bySource, peakMonth, largest, largestDay };
}

/**
 * Stacks the payments that share a date into one bar per day.
 *
 * Occurrences arrive sorted by day, then by item, so a source keeps the same
 * position in every column it appears in — a stack reads as a comparison
 * across days only when the bands don't shuffle underneath it.
 */
export function stackByDay(occurrences: Occurrence[]): Map<string, StackedOccurrence> {
  const stacked = new Map<string, StackedOccurrence>();
  let index = 0;

  while (index < occurrences.length) {
    const day = occurrences[index].dayOfYear;
    let end = index;
    while (end < occurrences.length && occurrences[end].dayOfYear === day) end += 1;

    // Two passes over the day's slice: the first totals it, so every band can
    // carry the whole column's height and the tooltip can name it without
    // walking the list again.
    let total = 0;
    for (let at = index; at < end; at += 1) total += occurrences[at].amount;

    let base = 0;
    for (let at = index; at < end; at += 1) {
      const occurrence = occurrences[at];
      stacked.set(occurrence.id, {
        base,
        total,
        depth: at - index,
        count: end - index,
      });
      base += occurrence.amount;
    }

    index = end;
  }

  return stacked;
}

/** Plain-English summary of an item, in the register of `describeExtras`. */
export function describeCadence(item: IncomeItem, year: number): string {
  const amount = formatMoney(Number(item.amount) || 0);
  const anchor = parseDay(item.anchor, year);
  const ending = item.until ? `, until ${formatDay(parseDay(item.until, year))}` : "";

  if (item.cadence === "once") return `${amount} on ${formatDay(anchor)}`;

  const rhythm: Record<Exclude<Cadence, "once">, string> = {
    weekly: "every week",
    biweekly: "every two weeks",
    semimonthly: "twice a month",
    monthly: "every month",
    quarterly: "every quarter",
    semiannual: "twice a year",
    annual: "every year",
  };

  return `${amount} ${rhythm[item.cadence]} from ${formatDay(anchor)}${ending}`;
}
