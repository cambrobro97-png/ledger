import { MONTH_NAMES, addMonths, formatMonth, monthsBetween, parseMonth } from "./dates";
import { daysInMonth, formatDayValue, parseDay } from "./days";
import { formatMoney } from "./format";
import type {
  AmortizationResult,
  CalendarMonth,
  ExpenseItem,
  Loan,
  MortgageLink,
  MortgagePart,
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
  scenarioName: string;
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

/**
 * Whether a stored `YYYY-MM` is one we can parse.
 *
 * `parseMonth` falls back to the current month, which reads the clock — fine
 * where a person is typing into a month field, wrong here: resolution runs
 * during render, and a value that differs between the prerender and the browser
 * throws at hydration. Anything unparseable is reported as unresolved instead.
 */
function isMonthValue(value: string | undefined): boolean {
  return /^\d{4}-\d{2}$/.test(value ?? "");
}

/** A date in a given month, on a given day, clamped to months that are too short. */
function dateIn(month: CalendarMonth, day: number): string {
  return formatDayValue({
    year: month.year,
    month: month.month,
    day: Math.min(Math.max(1, day), daysInMonth(month.year, month.month)),
  });
}

function unresolved(scenarioName: string, note: string): LinkResolution {
  return { status: "unresolved", scenarioName, note };
}

/** The derived half of a linked line: everything the mortgage tool decides. */
interface Derived {
  amount: number;
  cadence: ExpenseItem["cadence"];
  anchor: string;
  until: string;
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
        scenarioName: "",
        note: "The scenario this came from has been deleted — these are the figures it was linked with.",
      },
    };
  }

  const run = source.runs.get(link.scenarioId);
  if (!run) {
    return { derived: null, resolution: unresolved(scenario.name, "That scenario hasn't been run against the loan.") };
  }
  if (!run.ok) {
    return { derived: null, resolution: unresolved(scenario.name, run.reason) };
  }
  if (!isMonthValue(source.loan.start)) {
    return {
      derived: null,
      resolution: unresolved(scenario.name, "The loan needs a month its balance is accurate as of."),
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
        scenarioName: scenario.name,
        note: extra
          ? `${formatMoney(payment)} a month plus ${formatMoney(extra)} of extra principal, until ${formatMonth(payoff)}.`
          : `${formatMoney(payment)} a month until ${formatMonth(payoff)}.`,
      },
    };
  }

  if (link.part === "pmi") {
    const pmi = source.loan.pmi;
    if (!pmi?.enabled) {
      return { derived: null, resolution: unresolved(scenario.name, "PMI is switched off in the mortgage tool.") };
    }
    if (!run.pmi) {
      return {
        derived: null,
        resolution: unresolved(scenario.name, "PMI needs a premium and a home value before it can be worked out."),
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
        scenarioName: scenario.name,
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
      return { derived: null, resolution: unresolved(scenario.name, "This scenario has no yearly extra payment.") };
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
        scenarioName: scenario.name,
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
        scenarioName: scenario.name,
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
      scenarioName: scenario.name,
      note: `${formatMoney(Number(oneTime.amount) || 0)} in ${formatMonth(when)}.`,
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
): ResolvedExpenses {
  const resolutions = new Map<string, LinkResolution>();
  let changed = false;

  const resolved = items.map((item) => {
    const link = item.link;
    if (!link) return item;

    if (!source) {
      resolutions.set(item.id, { status: "pending", scenarioName: "", note: "" });
      return item;
    }

    const { derived, resolution } = resolveOne(item, link, source);
    resolutions.set(item.id, resolution);
    if (!derived) return item;

    // Only a real change earns a new object: an untouched item keeps its
    // identity, and so does the array, so nothing downstream rederives.
    if (
      derived.amount === item.amount &&
      derived.cadence === item.cadence &&
      derived.anchor === item.anchor &&
      derived.until === item.until
    ) {
      return item;
    }

    changed = true;
    return { ...item, ...derived };
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

  return {
    name: nameFor(part),
    link,
    // The premium is insurance rather than housing, which also gives it its own
    // colour on the timeline instead of hiding inside the payment's.
    category: part === "pmi" ? "insurance" : "housing",
    // Extra principal is a decision, not a bill — the same distinction the
    // fixed/variable split is there to make.
    kind: part === "annual" || part === "lump" ? "variable" : "fixed",
    ...(derived ?? {}),
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
