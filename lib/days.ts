import { MONTH_NAMES } from "./dates";
import type { CalendarDay } from "./types";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Days in each month, January first. February is corrected by `daysInMonth`. */
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return month === 1 && isLeapYear(year) ? 29 : MONTH_LENGTHS[month];
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/** Today as `YYYY-MM-DD`, the format used by `<input type="date">`. */
export function todayValue(): string {
  const now = new Date();
  return formatDayValue({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() });
}

/** Serialises back to `YYYY-MM-DD` for the date inputs. */
export function formatDayValue(value: CalendarDay): string {
  const month = String(value.month + 1).padStart(2, "0");
  const day = String(value.day).padStart(2, "0");
  return `${value.year}-${month}-${day}`;
}

/**
 * Parses `YYYY-MM-DD`, falling back to the first of the given year when the
 * value is empty or malformed. The fallback takes a year rather than reading
 * the clock so callers stay deterministic between server and client.
 */
export function parseDay(value: string | undefined, fallbackYear: number): CalendarDay {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return { year: fallbackYear, month: 0, day: 1 };

  const year = Number(match[1]);
  const month = Math.min(11, Math.max(0, Number(match[2]) - 1));
  const day = Math.min(daysInMonth(year, month), Math.max(1, Number(match[3])));
  return { year, month, day };
}

/** Days since 1970-01-01, so two dates can be compared and stepped as integers. */
export function toEpochDay(value: CalendarDay): number {
  return Math.round(Date.UTC(value.year, value.month, value.day) / 86_400_000);
}

export function fromEpochDay(epochDay: number): CalendarDay {
  const date = new Date(epochDay * 86_400_000);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate() };
}

export function addDays(value: CalendarDay, count: number): CalendarDay {
  return fromEpochDay(toEpochDay(value) + count);
}

/**
 * Adds whole months, clamping the day to the end of the target month so a
 * paycheck anchored on the 31st still lands in February.
 */
export function addMonthsClamped(value: CalendarDay, count: number): CalendarDay {
  const total = value.year * 12 + value.month + count;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  return { year, month, day: Math.min(value.day, daysInMonth(year, month)) };
}

export function compareDays(a: CalendarDay, b: CalendarDay): number {
  return toEpochDay(a) - toEpochDay(b);
}

/** The 13 cumulative month boundaries of a year, in days. Index 12 is the year's length. */
export function monthStartDays(year: number): number[] {
  const starts = [0];
  for (let month = 0; month < 12; month += 1) {
    starts.push(starts[month] + daysInMonth(year, month));
  }
  return starts;
}

/** 0-based offset of a date within its year, used as the timeline's x position. */
export function dayOfYear(value: CalendarDay): number {
  return monthStartDays(value.year)[value.month] + value.day - 1;
}

/** The only place a real Date is needed: weekday names for the hover readout. */
export function weekdayName(value: CalendarDay): string {
  return WEEKDAY_NAMES[new Date(Date.UTC(value.year, value.month, value.day)).getUTCDay()];
}

export function formatDay(value: CalendarDay): string {
  return `${MONTH_NAMES[value.month]} ${value.day}`;
}

export function formatDayLong(value: CalendarDay): string {
  return `${weekdayName(value)}, ${MONTH_NAMES[value.month]} ${value.day}`;
}
