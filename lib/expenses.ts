import { CADENCE_PER_YEAR, largestDayTotal, occurrencesFor, peakMonthOf, sortOccurrences } from "./schedule";
import type {
  ExpenseCategory,
  ExpenseItem,
  ExpenseKind,
  ExpenseYear,
  Occurrence,
} from "./types";

/**
 * The cadence engine expenses share with income. Re-exported so the expense
 * components read their vocabulary off `lib/expenses` — see `lib/schedule.ts`.
 */
export {
  ACCENTS,
  CADENCE_LABELS,
  CADENCE_ORDER,
  accentFor,
  describeCadence,
  occurrencesFor,
  stackByDay,
} from "./schedule";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing: "Housing",
  utilities: "Utilities",
  food: "Food",
  transport: "Transport",
  health: "Health",
  debt: "Debt",
  insurance: "Insurance",
  subscriptions: "Subscriptions",
  lifestyle: "Lifestyle",
  other: "Other",
};

/** Ordered roughly from the hardest bill to skip to the easiest. */
export const CATEGORY_ORDER: ExpenseCategory[] = [
  "housing",
  "utilities",
  "food",
  "transport",
  "health",
  "debt",
  "insurance",
  "subscriptions",
  "lifestyle",
  "other",
];

export const KIND_LABELS: Record<ExpenseKind, string> = {
  fixed: "Fixed",
  variable: "Variable",
};

export const KIND_ORDER: ExpenseKind[] = ["fixed", "variable"];

/**
 * A category's colour. Unlike income, where the colour is a per-item choice,
 * an expense takes its colour from what kind of spending it is — so the
 * timeline groups by category on sight, without a legend to consult.
 */
export const CATEGORY_ACCENTS: Record<ExpenseCategory, string> = {
  housing: "#5aa9e6",
  utilities: "#4fc3d9",
  food: "var(--jade)",
  transport: "#8fbf5f",
  health: "#e07a9c",
  debt: "var(--crimson)",
  insurance: "#9b8cd6",
  subscriptions: "#b48ce0",
  lifestyle: "var(--brass)",
  other: "var(--ash)",
};

export function categoryAccent(category: ExpenseCategory): string {
  return CATEGORY_ACCENTS[category] ?? CATEGORY_ACCENTS.other;
}

/**
 * What one line costs in a full year of its own rhythm, regardless of the year
 * on screen. A one-off has no rhythm to annualise, so it counts as nothing —
 * this measures the bill that comes back, not the money spent once.
 */
export function annualCostOf(item: ExpenseItem): number {
  const amount = Number(item.amount) || 0;
  if (amount <= 0 || item.cadence === "once") return 0;
  return amount * CADENCE_PER_YEAR[item.cadence];
}

/**
 * One pass over every item, producing everything the page draws. The timeline,
 * the month band, the category split, and the metrics all read this single
 * derived object.
 */
export function buildExpenseYear(items: ExpenseItem[], year: number): ExpenseYear {
  const occurrences: Occurrence[] = [];
  const byMonth = new Array(12).fill(0);
  const byItem: { itemId: string; total: number }[] = [];
  const categoryTotals = new Map<ExpenseCategory, number>();
  let total = 0;
  let largest = 0;
  let fixedTotal = 0;
  let variableTotal = 0;
  let recurringAnnual = 0;
  let heaviest: { itemId: string; total: number } | null = null;

  for (const item of items) {
    const generated = occurrencesFor(item, year);
    let itemTotal = 0;

    for (const occurrence of generated) {
      occurrences.push(occurrence);
      byMonth[occurrence.day.month] += occurrence.amount;
      itemTotal += occurrence.amount;
      if (occurrence.amount > largest) largest = occurrence.amount;
    }

    total += itemTotal;
    byItem.push({ itemId: item.id, total: itemTotal });
    categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + itemTotal);

    if (item.kind === "fixed") fixedTotal += itemTotal;
    else variableTotal += itemTotal;

    recurringAnnual += annualCostOf(item);

    // Ties go to the earlier line, so the figure doesn't flicker between two
    // equal rows as unrelated edits reorder nothing.
    if (itemTotal > 0 && (heaviest === null || itemTotal > heaviest.total)) {
      heaviest = { itemId: item.id, total: itemTotal };
    }
  }

  sortOccurrences(occurrences, items);

  // Kept in the canonical order rather than sorted by size, so a category
  // doesn't jump around the bar as amounts are edited.
  const byCategory = CATEGORY_ORDER.filter((category) => (categoryTotals.get(category) ?? 0) > 0).map(
    (category) => ({ category, total: categoryTotals.get(category) as number }),
  );

  // The cheapest month only means something among months that spend: a year
  // with nothing scheduled after June would otherwise report July as lean.
  let leanMonth = -1;
  for (let month = 0; month < 12; month += 1) {
    if (byMonth[month] > 0 && (leanMonth === -1 || byMonth[month] < byMonth[leanMonth])) {
      leanMonth = month;
    }
  }

  return {
    occurrences,
    byMonth,
    total,
    byItem,
    byCategory,
    peakMonth: peakMonthOf(byMonth),
    leanMonth,
    largest,
    largestDay: largestDayTotal(occurrences),
    fixedTotal,
    variableTotal,
    recurringAnnual,
    heaviest,
  };
}
