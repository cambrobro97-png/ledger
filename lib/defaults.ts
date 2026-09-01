import { addMonths, parseMonth } from "./dates";
import type {
  Account,
  AppState,
  ExpenseItem,
  ExpenseState,
  IncomeItem,
  IncomeState,
  OneTimePayment,
  Pmi,
  RetirementProfile,
  RetirementScenario,
  RetirementState,
  Scenario,
} from "./types";

export const STORAGE_KEY = "mortgage-payoff:v1";
export const INCOME_STORAGE_KEY = "income:v1";
export const EXPENSE_STORAGE_KEY = "expenses:v1";
export const RETIREMENT_STORAGE_KEY = "retirement:v1";

/**
 * The month the seed data is written around, as `YYYY-MM`.
 *
 * Deliberately a constant rather than `currentMonthValue()`. These factories run
 * on the server (at build time, in the build machine's timezone) and again in the
 * browser on the first client pass; anything read off the clock can differ
 * between the two — by timezone, since the same instant is `2026-01` in UTC and
 * `2025-12` in Chicago, and by staleness, since a build from December is served
 * into January. Either way React hydrates a tree whose year labels don't match
 * the markup and throws. The clock is applied after mount instead, by
 * `useClockDefaults`, which is the same shape as the fixed ids below.
 */
export const SEED_MONTH = "2026-01";

/** `SEED_MONTH`'s year, for the seed data that anchors to a year rather than a month. */
export const SEED_YEAR = Number(SEED_MONTH.slice(0, 4));

export function createId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function createScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: createId(),
    name: "New scenario",
    monthly: 200,
    annual: 0,
    annualMonth: 3,
    oneTimes: [],
    ...overrides,
  };
}

export function createOneTime(overrides: Partial<OneTimePayment> = {}): OneTimePayment {
  return { id: createId(), amount: 5000, month: "", ...overrides };
}

/**
 * Placeholder loan values. Replace them with your own in the loan panel;
 * everything downstream recalculates.
 */
export function createDefaultState(): AppState {
  // Fixed ids, so the markup the server renders matches the client's first pass.
  const scenarios: Scenario[] = [
    createScenario({ id: "as-it-stands", name: "As it stands", monthly: 0, annual: 0 }),
    createScenario({ id: "round-up", name: "Round up to $2,000", monthly: 325, annual: 0 }),
    createScenario({
      id: "refund-plus",
      name: "Refund plus a little",
      monthly: 250,
      annual: 3000,
      annualMonth: 3,
    }),
    createScenario({
      id: "all-in",
      name: "Everything we've got",
      monthly: 900,
      annual: 5000,
      annualMonth: 11,
      oneTimes: [createOneTime({ id: "all-in-lump", amount: 10000 })],
    }),
  ];

  return {
    loan: {
      balance: 248500,
      apr: 6.375,
      payment: 1675,
      start: SEED_MONTH,
      pmi: createPmi(),
    },
    scenarios,
    activeId: scenarios[0].id,
  };
}

/**
 * PMI defaults: switched off, but pre-filled so toggling it on shows a working
 * example rather than an empty form. 80% is the conventional threshold at which
 * a borrower can request cancellation.
 */
export function createPmi(overrides: Partial<Pmi> = {}): Pmi {
  return {
    enabled: false,
    monthly: 145,
    // Puts the seed loan a little over 87% LTV, so switching the mode on shows
    // a drop-off a few years out rather than one already at the threshold.
    homeValue: 285000,
    dropOffLtv: 80,
    reinvest: true,
    ...overrides,
  };
}

/** The year the income tool opens on, before the clock is applied after mount. */
export function currentYear(): number {
  return SEED_YEAR;
}

export function createIncomeItem(year: number, overrides: Partial<IncomeItem> = {}): IncomeItem {
  return {
    id: createId(),
    name: "New income",
    amount: 1000,
    cadence: "monthly",
    // Anchored off the viewed year rather than the clock, so nothing about a
    // new row depends on when the page happened to render.
    anchor: `${year}-01-01`,
    until: "",
    accent: 0,
    ...overrides,
  };
}

/**
 * Placeholder income. Replace it with your own below the timeline; the
 * timeline and totals recalculate from whatever is in the list.
 */
export function createDefaultIncomeState(): IncomeState {
  const year = currentYear();

  // Fixed ids, so the markup the server renders matches the client's first pass.
  const items: IncomeItem[] = [
    createIncomeItem(year, {
      id: "salary",
      name: "Salary",
      amount: 2450,
      cadence: "biweekly",
      anchor: `${year}-01-02`,
      accent: 0,
    }),
    createIncomeItem(year, {
      id: "freelance",
      name: "Freelance",
      amount: 1200,
      cadence: "monthly",
      anchor: `${year}-01-20`,
      accent: 3,
    }),
    createIncomeItem(year, {
      id: "bonus",
      name: "Annual bonus",
      amount: 6000,
      cadence: "annual",
      anchor: `${year}-03-13`,
      accent: 1,
    }),
  ];

  return { year, items };
}

export function createExpenseItem(
  year: number,
  overrides: Partial<ExpenseItem> = {},
): ExpenseItem {
  return {
    id: createId(),
    name: "New expense",
    amount: 100,
    cadence: "monthly",
    // Anchored off the viewed year rather than the clock, so nothing about a
    // new row depends on when the page happened to render.
    anchor: `${year}-01-01`,
    until: "",
    category: "other",
    kind: "fixed",
    accent: 0,
    ...overrides,
  };
}

/**
 * Placeholder spending. Replace it with your own below the timeline; the
 * timeline and totals recalculate from whatever is in the list.
 *
 * Deliberately a mixed bag — monthly bills, a quarterly one, two annual
 * premiums and a one-off — so the timeline opens on a year that actually has
 * a shape to it rather than twelve identical columns.
 */
export function createDefaultExpenseState(): ExpenseState {
  const year = currentYear();

  // Fixed ids, so the markup the server renders matches the client's first pass.
  const items: ExpenseItem[] = [
    createExpenseItem(year, {
      id: "rent",
      name: "Rent",
      amount: 1875,
      cadence: "monthly",
      anchor: `${year}-01-01`,
      category: "housing",
      kind: "fixed",
    }),
    createExpenseItem(year, {
      id: "utilities",
      name: "Power & water",
      amount: 210,
      cadence: "monthly",
      anchor: `${year}-01-12`,
      category: "utilities",
      kind: "variable",
    }),
    createExpenseItem(year, {
      id: "groceries",
      name: "Groceries",
      amount: 260,
      cadence: "weekly",
      anchor: `${year}-01-04`,
      category: "food",
      kind: "variable",
    }),
    createExpenseItem(year, {
      id: "car-payment",
      name: "Car payment",
      amount: 410,
      cadence: "monthly",
      anchor: `${year}-01-18`,
      category: "transport",
      kind: "fixed",
    }),
    createExpenseItem(year, {
      id: "car-insurance",
      name: "Car insurance",
      amount: 720,
      cadence: "semiannual",
      anchor: `${year}-02-05`,
      category: "insurance",
      kind: "fixed",
    }),
    createExpenseItem(year, {
      id: "streaming",
      name: "Streaming",
      amount: 46,
      cadence: "monthly",
      anchor: `${year}-01-08`,
      category: "subscriptions",
      kind: "variable",
    }),
    createExpenseItem(year, {
      id: "gym",
      name: "Gym",
      amount: 39,
      cadence: "monthly",
      anchor: `${year}-01-03`,
      category: "health",
      kind: "variable",
    }),
    createExpenseItem(year, {
      id: "property-tax",
      name: "Property tax",
      amount: 2400,
      cadence: "quarterly",
      anchor: `${year}-01-31`,
      category: "housing",
      kind: "fixed",
    }),
    createExpenseItem(year, {
      id: "holidays",
      name: "Holiday spending",
      amount: 1400,
      cadence: "once",
      anchor: `${year}-12-05`,
      category: "lifestyle",
      kind: "variable",
    }),
  ];

  return { year, items };
}

export function createAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: createId(),
    name: "New account",
    kind: "investment",
    balance: 0,
    returnRate: 6.5,
    monthlyContribution: 500,
    contributionGrowth: 0,
    matchRate: 100,
    matchLimitPct: 4,
    accent: 0,
    ...overrides,
  };
}

export function createRetirementScenario(
  overrides: Partial<RetirementScenario> = {},
): RetirementScenario {
  return {
    id: createId(),
    name: "New outlook",
    marketShift: 0,
    inflation: 2.5,
    colaIncrease: 0,
    annualSpend: 85000,
    withdrawal: "lowest-return-first",
    ...overrides,
  };
}

/**
 * Placeholder accounts and outlooks. Replace them with your own below the
 * charts; every projection recalculates from whatever is in the lists.
 */
export function createDefaultRetirementState(): RetirementState {
  const start = SEED_MONTH;
  const payoff = addMonths(parseMonth(start), 15 * 12);

  // Fixed ids, so the markup the server renders matches the client's first pass.
  const accounts: Account[] = [
    createAccount({
      id: "workplace-401k",
      name: "401(k)",
      kind: "401k",
      balance: 310000,
      returnRate: 7,
      monthlyContribution: 1200,
      contributionGrowth: 2,
      matchRate: 100,
      matchLimitPct: 4,
      accent: 0,
    }),
    createAccount({
      id: "brokerage",
      name: "Brokerage",
      kind: "investment",
      balance: 95000,
      returnRate: 6.5,
      monthlyContribution: 500,
      accent: 1,
    }),
    createAccount({
      id: "savings",
      name: "High-yield savings",
      kind: "cash",
      balance: 30000,
      returnRate: 2,
      monthlyContribution: 0,
      accent: 3,
    }),
  ];

  const scenarios: RetirementScenario[] = [
    createRetirementScenario({ id: "base-case", name: "Base case" }),
    createRetirementScenario({
      id: "bear-market",
      name: "Bear market",
      marketShift: -3,
      inflation: 3.5,
    }),
    createRetirementScenario({
      id: "optimist",
      name: "Optimist",
      marketShift: 2,
      inflation: 2,
    }),
    createRetirementScenario({
      id: "lean-spending",
      name: "Lean spending",
      annualSpend: 65000,
    }),
  ];

  const profile: RetirementProfile = {
    currentAge: 40,
    endAge: 95,
    salary: 140000,
    start,
    accounts,
    mortgagePayment: 1675,
    mortgagePayoff: `${payoff.year}-${String(payoff.month + 1).padStart(2, "0")}`,
  };

  return { profile, scenarios, activeId: scenarios[0].id };
}
