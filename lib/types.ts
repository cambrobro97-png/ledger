/**
 * Private mortgage insurance, as an optional advanced layer on the loan.
 *
 * PMI is escrow rather than principal or interest, so none of it lands in the
 * interest totals the rest of the app reports. What it contributes is a date —
 * the month the premium stops — and, if `reinvest` is set, an extra principal
 * payment of the same size from that month on.
 */
export interface Pmi {
  /** Off by default; the whole feature is opt-in. */
  enabled: boolean;
  /** The premium billed each month, on top of principal and interest. */
  monthly: number;
  /** What the home is worth, the denominator of the loan-to-value ratio. */
  homeValue: number;
  /** LTV percentage at which the premium stops, conventionally 80. */
  dropOffLtv: number;
  /** Whether the freed-up premium is then paid toward principal. */
  reinvest: boolean;
}

/** Loan terms that apply to every scenario. */
export interface Loan {
  /** Principal still owed today. */
  balance: number;
  /** Annual percentage rate, e.g. 6.375. */
  apr: number;
  /** Scheduled monthly payment covering principal and interest only. */
  payment: number;
  /** Month the balance is accurate as of, formatted `YYYY-MM`. */
  start: string;
  /** Optional PMI modelling; absent on state saved before the feature existed. */
  pmi?: Pmi;
}

/** A lump sum applied in one specific month. */
export interface OneTimePayment {
  id: string;
  amount: number;
  /** `YYYY-MM`; empty means "as soon as possible". */
  month: string;
}

/** One saved set of extra-principal contributions. */
export interface Scenario {
  id: string;
  name: string;
  /** Extra principal added to every payment. */
  monthly: number;
  /** Extra principal added once a year. */
  annual: number;
  /** Calendar month the annual contribution lands in, 0 = January. */
  annualMonth: number;
  oneTimes: OneTimePayment[];
}

export interface AppState {
  loan: Loan;
  scenarios: Scenario[];
  activeId: string;
}

export interface CalendarMonth {
  year: number;
  month: number;
}

/** Month-by-month result of running a scenario against a loan. */
export interface Amortization {
  ok: true;
  /** Number of payments until the balance reaches zero. */
  months: number;
  /** Balance at each month, index 0 being today. Length is months + 1. */
  balances: number[];
  /** Running total of interest paid, index 0 being zero. Length is months + 1. */
  cumulativeInterest: number[];
  /** Interest paid in each twelve-payment block. */
  interestByYear: number[];
  /** Principal retired in each twelve-payment block, extras included. */
  principalByYear: number[];
  totalInterest: number;
  totalExtra: number;
  payoffDate: CalendarMonth;
  /** What PMI did to this run, or null when it isn't switched on. */
  pmi: PmiOutcome | null;
}

/** What PMI cost and when it ended, for one run of the loan. */
export interface PmiOutcome {
  /**
   * Payment number the premium stopped on, or null when it is still being paid
   * at payoff — the loan can finish while LTV is still above the threshold.
   */
  dropOffMonth: number | null;
  /** Calendar month of `dropOffMonth`, or null when it never arrives. */
  dropOffDate: CalendarMonth | null;
  /** Premium paid in total, which is money spent outside principal and interest. */
  totalPaid: number;
  /** Premium redirected to principal after drop-off; zero unless reinvesting. */
  totalReinvested: number;
}

export interface AmortizationError {
  ok: false;
  reason: string;
}

export type AmortizationResult = Amortization | AmortizationError;

/** A single calendar date, the day-level counterpart to `CalendarMonth`. */
export interface CalendarDay {
  year: number;
  /** 0 = January. */
  month: number;
  /** 1-based, as written on a calendar. */
  day: number;
}

/** How often an income item repeats. */
export type Cadence =
  | "once"
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual";

/** One source of income: a salary, a side contract, a yearly bonus. */
export interface IncomeItem {
  id: string;
  name: string;
  /** Gross amount per occurrence, before any tax or deduction. */
  amount: number;
  cadence: Cadence;
  /** `YYYY-MM-DD`. The first payment; repeats are generated from here. */
  anchor: string;
  /** `YYYY-MM-DD` the income stops, for a raise or a job change. Empty means it runs on. */
  until: string;
  /** Index into `ACCENTS`, so a source keeps its colour everywhere it appears. */
  accent: number;
}

export interface IncomeState {
  /** The calendar year on screen. */
  year: number;
  items: IncomeItem[];
}

/** One payment landing on one date, materialised from an item's cadence. */
export interface Occurrence {
  /** `${itemId}:${date}` — stable across renders, so CSS transitions survive. */
  id: string;
  itemId: string;
  /** `YYYY-MM-DD`. */
  date: string;
  day: CalendarDay;
  /** 0-based offset within the year; the timeline's x position. */
  dayOfYear: number;
  amount: number;
}

/** Everything the income timeline draws, derived in one pass. */
export interface IncomeYear {
  occurrences: Occurrence[];
  /** Gross landing in each calendar month, January first. */
  byMonth: number[];
  total: number;
  /** Per-item totals, ordered as the items are. */
  bySource: { itemId: string; total: number }[];
  /** Index of the fattest month, or -1 when nothing lands all year. */
  peakMonth: number;
  /** The largest single payment, for scaling the marks. */
  largest: number;
  /** The largest total landing on any one day, which is what a stacked bar reaches. */
  largestDay: number;
}

/** Where one payment sits inside its day's stack, in money not pixels. */
export interface StackedOccurrence {
  /** Sum of the payments below this one that day; the band's floor. */
  base: number;
  /** The whole day's total, so a band can report the column it belongs to. */
  total: number;
  /** Position within the day, 0 at the bottom. */
  depth: number;
  /** How many payments share the day. */
  count: number;
}

/** A scenario measured against making no extra payments at all. */
export interface Comparison {
  monthsSaved: number;
  interestSaved: number;
  /** Share of the baseline interest bill avoided, from 0 to 1. */
  interestSavedShare: number;
  /** Interest avoided per extra dollar contributed. */
  savingsPerDollar: number;
}

/**
 * What kind of savings vehicle an account is. Only `401k` takes an employer
 * match; the split also decides what a withdrawal strategy reaches for first.
 */
export type AccountKind = "401k" | "investment" | "cash";

/** One savings vehicle. Shared across every scenario. */
export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  balance: number;
  /** Baseline annual return, e.g. 7. A scenario's `marketShift` moves this. */
  returnRate: number;
  /** Recurring contribution, in dollars per month. */
  monthlyContribution: number;
  /** Percent the contribution steps up each year, e.g. 3. Zero holds it flat. */
  contributionGrowth: number;
  /** 401k only: the share of your contribution the employer matches, e.g. 100. */
  matchRate: number;
  /** 401k only: the share of salary that match stops at, e.g. 4. */
  matchLimitPct: number;
  /** Index into `ACCENTS`, so an account keeps its colour everywhere it appears. */
  accent: number;
}

/** Which account a retired year spends out of first. */
export type WithdrawalStrategy = "lowest-return-first" | "proportional" | "taxable-first";

/** Shared facts about you and your accounts, applying to every scenario. */
export interface RetirementProfile {
  currentAge: number;
  /** Age the money has to last to. This is the test a retirement age must pass. */
  endAge: number;
  /** Gross salary, used only to size the employer match. */
  salary: number;
  /** Month the balances are accurate as of, formatted `YYYY-MM`. */
  start: string;
  accounts: Account[];
  /** Monthly mortgage payment, dropped from spending once it's paid off. */
  mortgagePayment: number;
  /** `YYYY-MM` the mortgage ends. Empty means it runs the whole projection. */
  mortgagePayoff: string;
}

/** One market and spending outlook to test the profile against. */
export interface RetirementScenario {
  id: string;
  name: string;
  /** Percentage points added to every account's return, e.g. -3 for a bear case. */
  marketShift: number;
  /** Annual inflation, e.g. 2.5. */
  inflation: number;
  /** Lifestyle creep on top of inflation, e.g. 0.5. */
  colaIncrease: number;
  /** Target annual spend in today's dollars, with the mortgage counted separately. */
  annualSpend: number;
  withdrawal: WithdrawalStrategy;
}

export interface RetirementState {
  profile: RetirementProfile;
  scenarios: RetirementScenario[];
  activeId: string;
}

/**
 * Year-by-year result of running a scenario against a profile. Every series is
 * indexed by year from today, and runs the full horizon through `endAge`.
 */
export interface Projection {
  ok: true;
  /** The answer: the earliest age you can stop working and still reach `endAge`. */
  retirementAge: number;
  /** Years from today until that age, which is also the index the series turn at. */
  retirementYearIndex: number;
  retirementDate: CalendarMonth;
  /** True when no age worked, so the figures describe the best attempt instead. */
  shortfall: boolean;
  /** Balance at each year, index 0 being today. */
  balances: number[];
  /** Per-account balances, the outer index matching `profile.accounts`. */
  balancesByAccount: number[][];
  /** Your own contributions each year, employer match excluded. */
  contributionsByYear: number[];
  matchByYear: number[];
  growthByYear: number[];
  withdrawalsByYear: number[];
  /** What each year costs to live, inflated, with the mortgage until it's paid off. */
  spendingByYear: number[];
  /** What the balance could safely throw off that year, at 4%. */
  sustainableDrawByYear: number[];
  peakBalance: number;
  /** What's left at `endAge`. Zero when the plan only just works. */
  endingBalance: number;
  totalContributed: number;
  totalMatch: number;
  totalGrowth: number;
  /** Age the money runs out, or null when it lasts through `endAge`. */
  depletionAge: number | null;
}

export interface ProjectionError {
  ok: false;
  reason: string;
}

export type ProjectionResult = Projection | ProjectionError;

/** A scenario measured against the baseline outlook. */
export interface RetirementComparison {
  /** Years sooner than the baseline lets you retire. Negative means later. */
  yearsEarlier: number;
  /** What's left at `endAge`, against the baseline's. */
  balanceDelta: number;
  /** Lifetime spending against the baseline's. */
  spendDelta: number;
}
