import {
  MONTH_NAMES,
  addMonths,
  formatMonth,
  formatMonthValue,
  isMonthValue,
  monthsBetween,
  parseMonth,
} from "./dates";
import { daysInMonth, formatDayValue, parseDay } from "./days";
import { annualCostOf } from "./expenses";
import { annualIncomeOf } from "./income";
import { activeShare } from "./retirement";
import { formatMoney } from "./format";
import type {
  Account,
  AmortizationResult,
  CalendarMonth,
  ExpenseItem,
  IncomeItem,
  Loan,
  MortgageLink,
  MortgagePart,
  RetirementLink,
  RetirementProfile,
  RetirementScenario,
  Scenario,
} from "./types";

/**
 * Where one tool's figures come from another's.
 *
 * Links only ever point one way — mortgage → expenses → retirement. Nothing
 * here writes to the tool it reads, and no tool reads a tool that reads it
 * back, so resolving is a single pass with no order to get right and no way for
 * two tools to chase each other. A new link that would close the loop (spending
 * that feeds retirement, from a retirement figure) has to be broken somewhere
 * else first.
 */

/** Everything a link needs from the mortgage tool, exactly as its summary reports it. */
export interface MortgageSource {
  loan: Loan;
  scenarios: Scenario[];
  /** The scenario the mortgage tool has open, which is what a picker opens on. */
  activeId: string;
  /** Each scenario's run, keyed by id. A link's dates come out of these. */
  runs: Map<string, AmortizationResult>;
}

/** Everything a link needs from the retirement tool. See `useRetirementAccounts`. */
export interface RetirementSource {
  accounts: Account[];
}

export const MORTGAGE_PART_LABELS: Record<MortgagePart, string> = {
  payment: "Monthly payment",
  pmi: "PMI premium",
  annual: "Yearly extra principal",
  lump: "Lump sum",
};

/**
 * How a link is faring.
 *
 * `pending` is not a problem: it is the frame before the other tool's stored
 * state has been read, where the honest thing is to show the figures saved with
 * the link and say nothing. `missing` and `unresolved` are worth saying out
 * loud — the first because someone deleted what this pointed at, the second
 * because the mortgage tool can't currently produce the figure.
 */
export type LinkStatus = "live" | "pending" | "missing" | "unresolved";

export interface LinkResolution {
  status: LinkStatus;
  /** The scenario the figures come from. Empty once it's gone. */
  sourceName: string;
  /** What this line is, or why it couldn't be worked out. */
  note: string;
}

export interface ResolvedExpenses {
  /**
   * The items as the rest of the app should see them, linked lines filled in.
   * The same array is handed back untouched when nothing is linked, so the
   * derivation downstream doesn't rerun for a list that hasn't changed.
   */
  items: ExpenseItem[];
  /** Keyed by item id, and only for the linked ones. */
  resolutions: Map<string, LinkResolution>;
}

/** A date in a given month, on a given day, clamped to months that are too short. */
function dateIn(month: CalendarMonth, day: number): string {
  return formatDayValue({
    year: month.year,
    month: month.month,
    day: Math.min(Math.max(1, day), daysInMonth(month.year, month.month)),
  });
}

function unresolved(sourceName: string, note: string): LinkResolution {
  return { status: "unresolved", sourceName, note };
}

/**
 * The derived half of a linked line: whatever the other tool decides.
 *
 * A null date means the other tool has no opinion about it and the expense
 * list's own value stands — which is every date on a contributions line.
 */
interface Derived {
  amount: number;
  cadence: ExpenseItem["cadence"];
  anchor: string | null;
  until: string | null;
}

/**
 * One linked line worked out against the mortgage tool.
 *
 * A line that can't be resolved keeps the figures stored with it rather than
 * dropping to zero — those are the ones that were true when it was linked, and
 * a timeline that quietly loses a mortgage is worse than one showing a stale
 * payment next to a note saying so.
 */
function resolveOne(
  item: ExpenseItem,
  link: MortgageLink,
  source: MortgageSource,
): { derived: Derived | null; resolution: LinkResolution } {
  const scenario = source.scenarios.find((candidate) => candidate.id === link.scenarioId);
  if (!scenario) {
    return {
      derived: null,
      resolution: {
        status: "missing",
        sourceName: "",
        note: "The scenario this came from has been deleted — these are the figures it was linked with.",
      },
    };
  }

  const run = source.runs.get(link.scenarioId);
  if (!run) {
    return {
      derived: null,
      resolution: unresolved(scenario.name, "That scenario hasn't been run against the loan."),
    };
  }
  if (!run.ok) {
    return { derived: null, resolution: unresolved(scenario.name, run.reason) };
  }
  if (!isMonthValue(source.loan.start)) {
    return {
      derived: null,
      resolution: unresolved(
        scenario.name,
        "The loan needs a month its balance is accurate as of.",
      ),
    };
  }

  const start = parseMonth(source.loan.start);
  // The day is the one part of a linked line the mortgage tool has no opinion
  // about — it works in whole months — so it stays the expense list's own.
  const day = parseDay(item.anchor, start.year).day;
  // Payment one lands the month after the balance is taken, and the run counts
  // from there, so every date below is measured off `start` the same way.
  const first = addMonths(start, 1);
  const payoff = run.payoffDate;

  if (link.part === "payment") {
    const payment = Number(source.loan.payment) || 0;
    const extra = link.includeExtra ? Number(scenario.monthly) || 0 : 0;
    return {
      derived: {
        amount: payment + extra,
        cadence: "monthly",
        anchor: dateIn(first, day),
        until: dateIn(payoff, day),
      },
      resolution: {
        status: "live",
        sourceName: scenario.name,
        note: extra
          ? `${formatMoney(payment)} a month plus ${formatMoney(extra)} of extra principal, until ${formatMonth(payoff)}.`
          : `${formatMoney(payment)} a month until ${formatMonth(payoff)}.`,
      },
    };
  }

  if (link.part === "pmi") {
    const pmi = source.loan.pmi;
    if (!pmi?.enabled) {
      return {
        derived: null,
        resolution: unresolved(scenario.name, "PMI is switched off in the mortgage tool."),
      };
    }
    if (!run.pmi) {
      return {
        derived: null,
        resolution: unresolved(
          scenario.name,
          "PMI needs a premium and a home value before it can be worked out.",
        ),
      };
    }

    // `dropOffMonth` is the first payment charged without the premium, so the
    // last one that carries it is the payment before. Null means it is still
    // being paid when the loan finishes.
    const dropOff = run.pmi.dropOffMonth;
    const last = dropOff === null ? payoff : addMonths(start, dropOff - 1);

    if (dropOff !== null && dropOff <= 1) {
      return {
        derived: null,
        resolution: unresolved(
          scenario.name,
          "The balance is already under the drop-off threshold, so no premium is charged.",
        ),
      };
    }

    return {
      derived: {
        amount: Number(pmi.monthly) || 0,
        cadence: "monthly",
        anchor: dateIn(first, day),
        until: dateIn(last, day),
      },
      resolution: {
        status: "live",
        sourceName: scenario.name,
        note:
          dropOff === null
            ? `${formatMoney(Number(pmi.monthly) || 0)} a month — still being paid when the loan finishes in ${formatMonth(payoff)}.`
            : `${formatMoney(Number(pmi.monthly) || 0)} a month until it drops off after ${formatMonth(last)}.`,
      },
    };
  }

  if (link.part === "annual") {
    const annual = Number(scenario.annual) || 0;
    if (annual <= 0) {
      return {
        derived: null,
        resolution: unresolved(scenario.name, "This scenario has no yearly extra payment."),
      };
    }

    // The run adds the yearly extra in whichever payment month matches, so the
    // first one is the next time that month comes round after payment one.
    const month = Math.min(11, Math.max(0, Number(scenario.annualMonth) || 0));
    const anchorMonth: CalendarMonth = {
      year: month >= first.month ? first.year : first.year + 1,
      month,
    };

    return {
      derived: {
        amount: annual,
        cadence: "annual",
        anchor: dateIn(anchorMonth, day),
        until: dateIn(payoff, day),
      },
      resolution: {
        status: "live",
        sourceName: scenario.name,
        note: `${formatMoney(annual)} every ${MONTH_NAMES[month]}, until ${formatMonth(payoff)}.`,
      },
    };
  }

  const oneTime = scenario.oneTimes.find((candidate) => candidate.id === link.oneTimeId);
  if (!oneTime) {
    return {
      derived: null,
      resolution: {
        status: "missing",
        sourceName: scenario.name,
        note: "That lump sum is no longer in the scenario — this is the figure it was linked with.",
      },
    };
  }

  // Same clamp the run applies: a lump with no month, or one dated before the
  // first payment, lands on the first payment.
  const offset = isMonthValue(oneTime.month)
    ? Math.max(1, monthsBetween(start, parseMonth(oneTime.month)))
    : 1;
  const when = addMonths(start, offset);

  return {
    derived: {
      amount: Number(oneTime.amount) || 0,
      cadence: "once",
      anchor: dateIn(when, day),
      // A one-off has nothing to stop.
      until: "",
    },
    resolution: {
      status: "live",
      sourceName: scenario.name,
      note: `${formatMoney(Number(oneTime.amount) || 0)} in ${formatMonth(when)}.`,
    },
  };
}

/**
 * A contributions line worked out against the retirement accounts.
 *
 * Only the money and the rhythm come from there. The dates stay the expense
 * list's own: the retirement tool has no opinion about which day of the month
 * a contribution leaves, and no honest opinion about when it stops — see
 * `RetirementLink`.
 */
function resolveContributions(
  link: RetirementLink,
  source: RetirementSource,
): { derived: Derived | null; resolution: LinkResolution } {
  const named = link.accountId
    ? source.accounts.find((candidate) => candidate.id === link.accountId)
    : null;

  if (link.accountId && !named) {
    return {
      derived: null,
      resolution: {
        status: "missing",
        sourceName: "",
        note: "The account this came from has been deleted — this is the figure it was linked with.",
      },
    };
  }

  const monthly = named
    ? Number(named.monthlyContribution) || 0
    : source.accounts.reduce(
        (total, account) => total + (Number(account.monthlyContribution) || 0),
        0,
      );

  const sourceName = named ? named.name || "an account" : "every account";

  if (monthly <= 0) {
    return {
      derived: null,
      resolution: unresolved(sourceName, "Nothing is being contributed there yet."),
    };
  }

  return {
    // Cadence and amount only: the anchor and the end date are left exactly as
    // the expense list has them.
    derived: { amount: monthly, cadence: "monthly", anchor: null, until: null },
    resolution: {
      status: "live",
      sourceName,
      note: `${formatMoney(monthly)} a month into ${sourceName}.`,
    },
  };
}

/**
 * Fills in every linked line from the mortgage tool.
 *
 * Pass `null` for the source while the mortgage tool's stored state is still
 * being read: the lines then keep the figures saved with them and say nothing,
 * which is the one frame where a "couldn't work this out" note would be wrong.
 */
export function resolveExpenseItems(
  items: ExpenseItem[],
  source: MortgageSource | null,
  retirement: RetirementSource | null = null,
): ResolvedExpenses {
  const resolutions = new Map<string, LinkResolution>();
  let changed = false;

  const resolved = items.map((item) => {
    const link = item.link;
    if (!link) return item;

    const ready = link.source === "mortgage" ? source : retirement;
    if (!ready) {
      resolutions.set(item.id, { status: "pending", sourceName: "", note: "" });
      return item;
    }

    const { derived, resolution } =
      link.source === "mortgage"
        ? resolveOne(item, link, source as MortgageSource)
        : resolveContributions(link, retirement as RetirementSource);

    resolutions.set(item.id, resolution);
    if (!derived) return item;

    const anchor = derived.anchor ?? item.anchor;
    const until = derived.until ?? item.until;

    // Only a real change earns a new object: an untouched item keeps its
    // identity, and so does the array, so nothing downstream rederives.
    if (
      derived.amount === item.amount &&
      derived.cadence === item.cadence &&
      anchor === item.anchor &&
      until === item.until
    ) {
      return item;
    }

    changed = true;
    return { ...item, amount: derived.amount, cadence: derived.cadence, anchor, until };
  });

  return { items: changed ? resolved : items, resolutions };
}

/** One thing a scenario offers to put on the expense list. */
export interface MortgagePartOption {
  /** Unique per option, since a scenario can offer several lump sums. */
  key: string;
  part: MortgagePart;
  oneTimeId?: string;
  label: string;
  /** What linking it would put on the timeline, in money and dates. */
  detail: string;
  /** False when the scenario has nothing of this kind, or it can't be worked out. */
  available: boolean;
}

/** A link as it would be stored, for a part of a scenario. */
function linkFor(scenarioId: string, part: MortgagePart, oneTimeId?: string): MortgageLink {
  return { source: "mortgage", scenarioId, part, includeExtra: part === "payment", oneTimeId };
}

/**
 * The name a linked line opens with. Editable afterwards like any other, so
 * this only has to be recognisable rather than right for everyone.
 */
function nameFor(part: MortgagePart): string {
  if (part === "payment") return "Mortgage";
  if (part === "pmi") return "PMI";
  if (part === "annual") return "Mortgage — yearly extra";
  return "Mortgage — lump sum";
}

/**
 * The expense a linked line starts as.
 *
 * The derived figures are worked out once here as well as on every render, so
 * the values written to storage are true at the moment of linking. They are
 * only ever read again as the fallback for a link that has since broken.
 */
export function mortgageLinkSeed(
  source: MortgageSource,
  scenarioId: string,
  part: MortgagePart,
  oneTimeId?: string,
): Partial<ExpenseItem> {
  const link = linkFor(scenarioId, part, oneTimeId);
  // A stub on the first of the month: `resolveOne` reads only the day off it.
  const stub: ExpenseItem = {
    id: "",
    name: nameFor(part),
    amount: 0,
    cadence: "monthly",
    anchor: "",
    until: "",
    accent: 0,
    category: "housing",
    kind: "fixed",
    link,
  };

  const { derived } = resolveOne(stub, link, source);

  // A mortgage link always decides its own dates, so the nulls `Derived` allows
  // for a contributions line can't arise here.
  const dates = derived
    ? {
        amount: derived.amount,
        cadence: derived.cadence,
        anchor: derived.anchor ?? "",
        until: derived.until ?? "",
      }
    : {};

  return {
    name: nameFor(part),
    link,
    // The premium is insurance rather than housing, which also gives it its own
    // colour on the timeline instead of hiding inside the payment's.
    category: part === "pmi" ? "insurance" : "housing",
    // Extra principal is a decision, not a bill — the same distinction the
    // fixed/variable split is there to make.
    kind: part === "annual" || part === "lump" ? "variable" : "fixed",
    ...dates,
  };
}

/**
 * The expense a contributions line starts as.
 *
 * Variable rather than fixed, by the expense tool's own definition: a
 * contribution is something a lean month can go below, however automatic it
 * feels. Its dates are left as any new line's, since the retirement tool has no
 * opinion about them.
 */
export function retirementLinkSeed(
  source: RetirementSource,
  accountId: string,
): Partial<ExpenseItem> {
  const link: RetirementLink = { source: "retirement", part: "contributions", accountId };
  const { derived, resolution } = resolveContributions(link, source);

  return {
    name: accountId ? `${resolution.sourceName} contributions` : "Retirement contributions",
    link,
    category: "other",
    kind: "variable",
    ...(derived ? { amount: derived.amount, cadence: derived.cadence } : {}),
  };
}

/** What a scenario has to offer the expense list, and what each piece would look like. */
export function mortgagePartOptions(
  source: MortgageSource,
  scenarioId: string,
): MortgagePartOption[] {
  const scenario = source.scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) return [];

  const describe = (part: MortgagePart, oneTimeId?: string): MortgagePartOption => {
    const link = linkFor(scenarioId, part, oneTimeId);
    const stub: ExpenseItem = {
      id: "",
      name: "",
      amount: 0,
      cadence: "monthly",
      anchor: "",
      until: "",
      accent: 0,
      category: "housing",
      kind: "fixed",
      link,
    };
    const { derived, resolution } = resolveOne(stub, link, source);

    return {
      key: oneTimeId ? `${part}:${oneTimeId}` : part,
      part,
      oneTimeId,
      label: MORTGAGE_PART_LABELS[part],
      detail: resolution.note || "Nothing to link here yet.",
      available: derived !== null,
    };
  };

  return [
    describe("payment"),
    describe("pmi"),
    describe("annual"),
    ...scenario.oneTimes.map((oneTime) => describe("lump", oneTime.id)),
  ];
}

/* --- The retirement profile's mortgage ---------------------------------- */

/** The mortgage figures a retirement projection runs on. */
export interface RetirementMortgage {
  /** Monthly outflow while the loan runs. */
  payment: number;
  /** `YYYY-MM` it ends, or empty for a projection that never drops it. */
  payoff: string;
  /** How the link is faring, or null when the figures were simply typed in. */
  resolution: LinkResolution | null;
}

/**
 * The retirement profile's mortgage, taken from a scenario when it is linked.
 *
 * The payment includes the scenario's monthly extra principal, deliberately and
 * without a switch. The payoff date is the one that scenario's run produces,
 * which only happens if the extra is actually being paid — so counting the
 * payoff while not counting what buys it would have the projection retire early
 * on money it never spent.
 *
 * A yearly extra or a lump sum still moves the payoff date but has no place in
 * a monthly figure, so neither appears here. The date accounts for them; the
 * monthly outflow doesn't.
 */
export function resolveRetirementMortgage(
  profile: RetirementProfile,
  source: MortgageSource | null,
): RetirementMortgage {
  const stored = {
    payment: Number(profile.mortgagePayment) || 0,
    payoff: profile.mortgagePayoff,
  };

  const link = profile.mortgageLink;
  if (!link) return { ...stored, resolution: null };

  if (!source) {
    return { ...stored, resolution: { status: "pending", sourceName: "", note: "" } };
  }

  const scenario = source.scenarios.find((candidate) => candidate.id === link.scenarioId);
  if (!scenario) {
    return {
      ...stored,
      resolution: {
        status: "missing",
        sourceName: "",
        note: "The scenario this came from has been deleted — these are the figures it was linked with.",
      },
    };
  }

  const run = source.runs.get(link.scenarioId);
  if (!run || !run.ok) {
    return {
      ...stored,
      resolution: unresolved(
        scenario.name,
        run && !run.ok ? run.reason : "That scenario hasn't been run against the loan.",
      ),
    };
  }

  const payment = (Number(source.loan.payment) || 0) + (Number(scenario.monthly) || 0);
  const payoff = formatMonthValue(run.payoffDate);

  return {
    payment,
    payoff,
    resolution: {
      status: "live",
      sourceName: scenario.name,
      note: `${formatMoney(payment)} a month until ${formatMonth(run.payoffDate)}.`,
    },
  };
}

/* --- An outlook's spending, from the expense list ------------------------ */

/** Everything a spend link needs from the expense tool. */
export interface ExpenseSource {
  /** The lines, already resolved — a linked mortgage line arrives filled in. */
  items: ExpenseItem[];
}

export interface RetirementSpend {
  /**
   * What a year of retirement costs, in today's dollars, for each projected
   * year. Null when the outlook isn't linked, or when the link has nothing to
   * offer — the typed figure is then used instead.
   */
  base: number[] | null;
  /** The first year's figure, which is what the outlook's spending field shows. */
  annual: number;
  /** How many repeating lines are being counted. */
  lineCount: number;
  /** Lines that stop inside the horizon, and what they cost a year today. */
  endingCount: number;
  endingAnnual: number;
  /** How the link is faring, or null when the figure was simply typed in. */
  resolution: LinkResolution | null;
}

/**
 * The span a line covers, in years from the start of the projection.
 *
 * Month granularity throughout: the projection steps a year at a time, and
 * `activeShare` is only accurate to the month either side anyway.
 *
 * The end is the month *after* the stop date, because `until` is inclusive —
 * the schedule engine pays a bill dated on it. Counting to the stop month
 * instead would quietly drop a line's last month of cost.
 */
function spanOf(item: ExpenseItem, start: CalendarMonth, horizon: number): [number, number] {
  const anchor = parseDay(item.anchor, start.year);
  // Anything already running is running at year zero; nothing starts in the past.
  const from = Math.max(0, monthsBetween(start, { year: anchor.year, month: anchor.month }) / 12);

  if (!item.until) return [from, horizon];
  const end = parseDay(item.until, start.year);
  const to = (monthsBetween(start, { year: end.year, month: end.month }) + 1) / 12;
  return [from, Math.max(from, to)];
}

/**
 * Whether a line counts toward a retirement budget at all.
 *
 * Shared with anything comparing today's spending against a retired year's, so
 * the two sides of that comparison can't be drawn on different rules. The
 * reasons for each exclusion are in `resolveRetirementSpend` below.
 */
export function countsTowardRetirement(item: ExpenseItem): boolean {
  if (item.link?.source === "retirement") return false;
  if (item.link?.part === "payment") return false;
  return annualCostOf(item) > 0;
}

/** What a year of today's repeating bills comes to, on a retirement budget's terms. */
export function comparableSpendToday(expenses: ExpenseSource | null): number {
  if (!expenses) return 0;
  return expenses.items.reduce(
    (total, item) => total + (countsTowardRetirement(item) ? annualCostOf(item) : 0),
    0,
  );
}

/**
 * An outlook's retirement spending, built from the expense list.
 *
 * The answer is a path rather than a single figure, which is the point: a line
 * with a stop date leaves the budget in the year it stops, so a car loan ending
 * in 2031 stops being retirement spending in 2031 without anyone having to
 * remember it would.
 *
 * The mortgage payment is left out on purpose. `RetirementProfile` carries it
 * separately, and drops it at payoff already — counting a linked mortgage line
 * here as well would put the same payment in the budget twice. Anything else
 * tied to the mortgage (the premium, a yearly extra) is money the profile does
 * not model, so it stays, and its own stop date takes it out at the right time.
 *
 * One-offs never count: `annualCostOf` reports nothing for them, and a cost
 * paid once this year says nothing about what a year of retirement costs.
 */
export function resolveRetirementSpend(
  profile: RetirementProfile,
  scenario: RetirementScenario,
  source: ExpenseSource | null,
): RetirementSpend {
  const typed = Number(scenario.annualSpend) || 0;
  const bare = { base: null, annual: typed, lineCount: 0, endingCount: 0, endingAnnual: 0 };

  const link = scenario.spendLink;
  if (!link) return { ...bare, resolution: null };
  if (!source) {
    return { ...bare, resolution: { status: "pending", sourceName: "", note: "" } };
  }

  const horizon = (Number(profile.endAge) || 0) - (Number(profile.currentAge) || 0);
  if (horizon <= 0) {
    return {
      ...bare,
      resolution: unresolved(
        "the expense list",
        "There is no horizon to spread the spending over.",
      ),
    };
  }
  if (!isMonthValue(profile.start)) {
    return {
      ...bare,
      resolution: unresolved(
        "the expense list",
        "The profile needs a month its balances are accurate as of.",
      ),
    };
  }

  const start = parseMonth(profile.start);
  const adjust = Math.max(0, Number(link.adjustPct) || 0) / 100;

  const counted = source.items.filter((item) => {
    /*
     * `countsTowardRetirement` holds the two exclusions:
     *
     * Money going into the retirement accounts is not a cost of being retired.
     * It stops when the contributing does — and beyond being wrong, counting it
     * would be the one link in this file that closes a loop: spending built from
     * a line that is itself built from the retirement tool.
     *
     * And the profile already carries the mortgage payment, dropping it at
     * payoff, so counting a linked payment line here would bill it twice.
     */
    if (!countsTowardRetirement(item)) return false;
    return link.basis === "all" || item.kind === "fixed";
  });

  const base = new Array<number>(horizon).fill(0);
  let endingCount = 0;
  let endingAnnual = 0;

  for (const item of counted) {
    const cost = annualCostOf(item);
    const [from, to] = spanOf(item, start, horizon);

    if (to < horizon) {
      endingCount += 1;
      endingAnnual += cost;
    }

    for (let year = 0; year < horizon; year += 1) {
      base[year] += cost * adjust * activeShare(year, from, to);
    }
  }

  if (base[0] <= 0) {
    return {
      ...bare,
      lineCount: counted.length,
      resolution: unresolved(
        "the expense list",
        counted.length === 0
          ? "No repeating expenses to build a budget from, so the figure below is being used."
          : "Those expenses have all stopped by the time the projection starts.",
      ),
    };
  }

  const adjusted = adjust !== 1 ? ` at ${Math.round(adjust * 100)}% of today's` : "";
  const ending =
    endingCount > 0 ? ` ${formatMoney(endingAnnual)} of it stops before ${profile.endAge}.` : "";

  return {
    base,
    annual: base[0],
    lineCount: counted.length,
    endingCount,
    endingAnnual,
    resolution: {
      status: "live",
      sourceName: "the expense list",
      note: `${formatMoney(base[0])} a year from ${counted.length} repeating ${counted.length === 1 ? "line" : "lines"}${adjusted}, with the mortgage counted separately.${ending}`,
    },
  };
}

/* --- Income: the salary, and what is spare ------------------------------ */

/** Everything a link needs from the income tool. */
export interface IncomeSource {
  items: IncomeItem[];
}

/**
 * The salary a retirement projection sizes its employer match against.
 *
 * Naming one source is usually right: the match ceiling is a share of salary,
 * and a bonus or a side contract doesn't raise it. An empty `itemId` counts
 * every repeating source instead, for anyone whose pay genuinely is the sum of
 * several. One-offs never count either way — `annualIncomeOf` reports nothing
 * for them.
 */
export function resolveSalary(
  profile: RetirementProfile,
  source: IncomeSource | null,
): { salary: number; resolution: LinkResolution | null } {
  const typed = Number(profile.salary) || 0;
  const link = profile.salaryLink;
  if (!link) return { salary: typed, resolution: null };
  if (!source) {
    return { salary: typed, resolution: { status: "pending", sourceName: "", note: "" } };
  }

  if (link.itemId) {
    const item = source.items.find((candidate) => candidate.id === link.itemId);
    if (!item) {
      return {
        salary: typed,
        resolution: {
          status: "missing",
          sourceName: "",
          note: "The income source this came from has been deleted — this is the figure it was linked with.",
        },
      };
    }

    const salary = annualIncomeOf(item);
    if (salary <= 0) {
      return {
        salary: typed,
        resolution: unresolved(
          item.name,
          "That source doesn't repeat, so it has no yearly figure.",
        ),
      };
    }

    return {
      salary,
      resolution: {
        status: "live",
        sourceName: item.name || "an income source",
        note: `${formatMoney(salary)} a year, from ${item.name || "an income source"}.`,
      },
    };
  }

  const salary = source.items.reduce((total, item) => total + annualIncomeOf(item), 0);
  if (salary <= 0) {
    return {
      salary: typed,
      resolution: unresolved("the income list", "No repeating income to take a salary from."),
    };
  }

  return {
    salary,
    resolution: {
      status: "live",
      sourceName: "the income list",
      note: `${formatMoney(salary)} a year, from every repeating source.`,
    },
  };
}

/** What the year's rhythms leave over, before any extra principal. */
export interface SpareMoney {
  /** Per month, and negative when the bills already run past the income. */
  spare: number;
  incomeAnnual: number;
  spendAnnual: number;
  /** Whether anything was found to measure — false when both lists are empty. */
  known: boolean;
}

/**
 * What is left each month once the bills are paid, before any extra principal.
 *
 * Extra principal is deliberately left out of the spending side. The question
 * this answers is how much there is *available* for extra principal, so
 * counting a scenario's own extra against it would have the answer shrink the
 * harder you already pay — and a scenario funded entirely out of surplus would
 * look unaffordable the moment it was entered.
 *
 * Annualised rather than taken from either tool's year totals, which is what
 * lets it ignore the two tools sitting on different years — and means a
 * three-payday month or a one-off holiday doesn't move it.
 */
export function spareEachMonth(
  income: IncomeSource | null,
  expenses: ExpenseSource | null,
  mortgage: Pick<MortgageSource, "loan" | "scenarios"> | null,
): SpareMoney {
  if (!income || !expenses) {
    return { spare: 0, incomeAnnual: 0, spendAnnual: 0, known: false };
  }

  const incomeAnnual = income.items.reduce((total, item) => total + annualIncomeOf(item), 0);

  let spendAnnual = 0;
  for (const item of expenses.items) {
    const part = item.link?.part;
    // A yearly extra or a lump sum is extra principal outright.
    if (part === "annual" || part === "lump") continue;

    /*
     * A mortgage line is costed from the loan rather than from the amount
     * stored on it. That amount was resolved against whatever the reader's
     * snapshot of the mortgage held, which on the mortgage page itself is the
     * loan as it was when the page loaded — so reading it back would have this
     * figure lag the payment being edited right next to it.
     */
    if (part === "payment") {
      spendAnnual += mortgage ? (Number(mortgage.loan.payment) || 0) * 12 : 0;
      continue;
    }
    if (part === "pmi") {
      const pmi = mortgage?.loan.pmi;
      spendAnnual += pmi?.enabled ? (Number(pmi.monthly) || 0) * 12 : 0;
      continue;
    }

    spendAnnual += Math.max(0, annualCostOf(item));
  }

  return {
    spare: (incomeAnnual - spendAnnual) / 12,
    incomeAnnual,
    spendAnnual,
    known: incomeAnnual > 0 || spendAnnual > 0,
  };
}
