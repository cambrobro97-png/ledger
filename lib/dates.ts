import type { CalendarMonth } from "./types";

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Today's month as `YYYY-MM`, the format used by `<input type="month">`. */
export function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Parses `YYYY-MM`, falling back to the current month when the value is empty or malformed. */
export function parseMonth(value: string | undefined): CalendarMonth {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  return { year: Number(match[1]), month: Number(match[2]) - 1 };
}

export function addMonths(base: CalendarMonth, count: number): CalendarMonth {
  const total = base.year * 12 + base.month + count;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export function monthsBetween(from: CalendarMonth, to: CalendarMonth): number {
  return to.year * 12 + to.month - (from.year * 12 + from.month);
}

export function formatMonth(value: CalendarMonth): string {
  return `${MONTH_NAMES[value.month]} ${value.year}`;
}
