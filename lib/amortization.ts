import { addMonths, monthsBetween, parseMonth } from "./dates";
import type {
  Amortization,
  AmortizationResult,
  Comparison,
  Loan,
  Pmi,
  PmiOutcome,
  Scenario,
} from "./types";

/** Simulation ceiling, so a pathological input can never spin forever. */
const MAX_MONTHS = 720;

/** The comparison every scenario is measured against: the scheduled payment, nothing more. */
export const BASELINE_SCENARIO: Scenario = {
  id: "__baseline__",
  name: "No extra payments",
  monthly: 0,
  annual: 0,
  annualMonth: 0,
  oneTimes: [],
};

/**
 * Whether this run is the yardstick rather than a real plan.
 *
 * The baseline still stops paying PMI on schedule — that happens to any
 * borrower who does nothing — but it never redirects the premium to principal,
 * because that is a choice, and the baseline is what you're compared against
 * for making choices. Letting the baseline recycle too would move the yardstick
 * further than the scenario in aggressive plans, which finish before much
 * premium is freed, and every "saved" figure would shrink the harder you paid.
 */
function isBaseline(scenario: Scenario): boolean {
  return scenario.id === BASELINE_SCENARIO.id;
}

/** Collapses a scenario's one-time payments into a map of payment number to amount. */
function oneTimesByMonth(loan: Loan, scenario: Scenario): Map<number, number> {
  const start = parseMonth(loan.start);
  const byMonth = new Map<number, number>();

  for (const payment of scenario.oneTimes) {
    const amount = Number(payment.amount) || 0;
    if (amount <= 0) continue;
    const index = payment.month
      ? Math.max(1, monthsBetween(start, parseMonth(payment.month)))
      : 1;
    byMonth.set(index, (byMonth.get(index) ?? 0) + amount);
  }

  return byMonth;
}

/** PMI as the simulation wants it: off entirely, or a premium with a threshold. */
function activePmi(loan: Loan): Pmi | null {
  const pmi = loan.pmi;
  if (!pmi || !pmi.enabled) return null;

  const monthly = Number(pmi.monthly) || 0;
  const homeValue = Number(pmi.homeValue) || 0;
  // Without a premium there is nothing to stop paying, and without a home value
  // there is no ratio to test — either way the loan behaves as if PMI is off.
  if (monthly <= 0 || homeValue <= 0) return null;

  return {
    enabled: true,
    monthly,
    homeValue,
    dropOffLtv: Number(pmi.dropOffLtv) || 0,
    reinvest: Boolean(pmi.reinvest),
  };
}

/**
 * Runs the loan forward one payment at a time, applying any extra principal
 * after the scheduled payment has covered that month's interest.
 */
export function simulate(loan: Loan, scenario: Scenario): AmortizationResult {
  const monthlyRate = (Number(loan.apr) || 0) / 100 / 12;
  const payment = Number(loan.payment) || 0;
  const start = parseMonth(loan.start);
  const oneTimes = oneTimesByMonth(loan, scenario);

  let balance = Number(loan.balance) || 0;

  if (balance <= 0) {
    return { ok: false, reason: "Enter the balance still owed to see any projections." };
  }
  if (payment <= balance * monthlyRate + 0.01) {
    return {
      ok: false,
      reason:
        "That payment doesn't cover the monthly interest on this balance, so the loan never amortizes. Check the rate and the payment amount.",
    };
  }

  const balances: number[] = [balance];
  const cumulativeInterest: number[] = [0];
  const interestByYear: number[] = [];
  const principalByYear: number[] = [];

  const baseline = isBaseline(scenario);
  const pmi = activePmi(loan);
  // The balance at which the premium stops. Computed once: it is a property of
  // the home's value, not of how the balance got there.
  const dropOffBalance = pmi ? pmi.homeValue * (pmi.dropOffLtv / 100) : 0;
  let dropOffMonth: number | null = null;
  let pmiPaid = 0;
  let pmiReinvested = 0;

  let totalInterest = 0;
  let totalExtra = 0;
  let month = 0;

  while (balance > 0.005 && month < MAX_MONTHS) {
    month += 1;

    // Tested before this month's payment, against the balance the servicer
    // would see when it bills — so the premium stops the month after the one
    // that carried the balance under the threshold, not the same month.
    const payingPmi = pmi !== null && balance > dropOffBalance;
    if (pmi && !payingPmi && dropOffMonth === null) dropOffMonth = month;
    if (payingPmi) pmiPaid += pmi.monthly;

    const interest = balance * monthlyRate;
    const scheduledPrincipal = Math.min(payment - interest, balance);
    const afterScheduled = balance - scheduledPrincipal;

    let extra = Number(scenario.monthly) || 0;
    const calendar = addMonths(start, month);
    if ((Number(scenario.annual) || 0) > 0 && calendar.month === (Number(scenario.annualMonth) || 0)) {
      extra += Number(scenario.annual);
    }
    extra += oneTimes.get(month) ?? 0;

    // Once the premium stops, that money is already in the budget, so
    // redirecting it to principal costs nothing new. The baseline abstains, so
    // that recycling reads as one of the scenario's savings.
    const recycled = pmi && pmi.reinvest && !payingPmi && !baseline ? pmi.monthly : 0;
    extra += recycled;

    extra = Math.max(0, Math.min(extra, afterScheduled));
    // Only what actually landed counts as reinvested — the final month usually
    // takes less than the full premium to finish the balance.
    const landedRecycled = Math.min(recycled, extra);
    pmiReinvested += landedRecycled;

    balance = afterScheduled - extra;
    totalInterest += interest;
    // The recycled premium is deliberately left out: it was already leaving the
    // account as PMI, so counting it here would overstate "extra out of pocket"
    // and dilute the interest-cancelled-per-dollar figure beside it.
    totalExtra += extra - landedRecycled;

    const yearIndex = Math.floor((month - 1) / 12);
    interestByYear[yearIndex] = (interestByYear[yearIndex] ?? 0) + interest;
    principalByYear[yearIndex] = (principalByYear[yearIndex] ?? 0) + scheduledPrincipal + extra;

    balances.push(Math.max(0, balance));
    cumulativeInterest.push(totalInterest);
  }

  // A drop-off recorded on the very last payment is not a drop-off the borrower
  // ever experiences — the loan ends that same month. Reporting it would
  // promise a premium-sized principal payment that never happens.
  const realDropOff = dropOffMonth !== null && dropOffMonth < month ? dropOffMonth : null;

  const pmiOutcome: PmiOutcome | null = pmi
    ? {
        dropOffMonth: realDropOff,
        dropOffDate: realDropOff === null ? null : addMonths(start, realDropOff),
        totalPaid: pmiPaid,
        totalReinvested: pmiReinvested,
      }
    : null;

  return {
    ok: true,
    months: month,
    balances,
    cumulativeInterest,
    interestByYear,
    principalByYear,
    totalInterest,
    totalExtra,
    payoffDate: addMonths(start, month),
    pmi: pmiOutcome,
  };
}

/** Measures a scenario against the do-nothing baseline. */
export function compare(baseline: Amortization, scenario: Amortization): Comparison {
  const interestSaved = baseline.totalInterest - scenario.totalInterest;
  return {
    monthsSaved: baseline.months - scenario.months,
    interestSaved,
    interestSavedShare: baseline.totalInterest > 0 ? interestSaved / baseline.totalInterest : 0,
    savingsPerDollar: scenario.totalExtra > 0 ? interestSaved / scenario.totalExtra : 0,
  };
}

/**
 * Stretches a series to a fixed length so charts can interpolate between
 * scenarios of different terms. Paid-off months hold the tail value.
 */
export function padSeries(series: number[], length: number, tail?: number): number[] {
  const out = series.slice(0, length + 1);
  const filler = tail ?? (series.length ? series[series.length - 1] : 0);
  while (out.length < length + 1) out.push(filler);
  return out;
}

/** Same idea for the per-year buckets, where empty years are genuinely zero. */
export function padYears(series: number[], length: number): number[] {
  const out = series.slice(0, length);
  while (out.length < length) out.push(0);
  return out;
}
