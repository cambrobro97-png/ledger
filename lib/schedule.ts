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
import type { Cadence, CalendarDay, Occurrence, ScheduledItem, StackedOccurrence } from "./types";

/**
 * Ceiling on how many payments one item may generate for a year. A year of
 * weekly pay is 53, so this only ever trips on a nonsense anchor — it exists
 * to keep a corrupt stored value from hanging the render, the same guard
 * `MAX_MONTHS` gives the amortization loop.
 */
const MAX_OCCURRENCES = 400;

/** Colours an item can wear, indexed by `ScheduledItem.accent`. */
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

/**
 * How many times a cadence comes round in a year, for annualising one
 * occurrence's amount without materialising the dates. `once` is deliberately
 * absent: a one-off has no yearly rhythm to speak of, and callers that need a
 * number for it should decide for themselves what a single payment means.
 */
export const CADENCE_PER_YEAR: Record<Exclude<Cadence, "once">, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
};

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
export function occurrencesFor(item: ScheduledItem, year: number): Occurrence[] {
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
 * Sorts a year's occurrences into the order the timeline stacks them.
 *
 * Within a day, ordered by the item's place in the list rather than by id:
 * the stack's bands are read against each other across days, so an item has
 * to keep the same position in every column it appears in.
 */
export function sortOccurrences(occurrences: Occurrence[], items: ScheduledItem[]): void {
  const order = new Map(items.map((item, index) => [item.id, index]));
  occurrences.sort(
    (a, b) =>
      a.dayOfYear - b.dayOfYear || (order.get(a.itemId) ?? 0) - (order.get(b.itemId) ?? 0),
  );
}

/**
 * The largest total landing on any one day, which is the height a stacked bar
 * reaches. Measured off the finished sort order so it counts the same columns
 * the timeline draws rather than a per-item guess.
 */
export function largestDayTotal(sorted: Occurrence[]): number {
  let largest = 0;
  for (let index = 0; index < sorted.length; ) {
    const day = sorted[index].dayOfYear;
    let dayTotal = 0;
    while (index < sorted.length && sorted[index].dayOfYear === day) {
      dayTotal += sorted[index].amount;
      index += 1;
    }
    if (dayTotal > largest) largest = dayTotal;
  }
  return largest;
}

/** Index of the fattest month in a twelve-month series, or -1 when it's all zero. */
export function peakMonthOf(byMonth: number[]): number {
  let peak = -1;
  for (let month = 0; month < 12; month += 1) {
    if (byMonth[month] > 0 && (peak === -1 || byMonth[month] > byMonth[peak])) peak = month;
  }
  return peak;
}

/**
 * Stacks the payments that share a date into one bar per day.
 *
 * Occurrences arrive sorted by day, then by item, so an item keeps the same
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
export function describeCadence(item: ScheduledItem, year: number): string {
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
