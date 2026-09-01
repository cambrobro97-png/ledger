import { addMonths, monthsBetween, parseMonth } from "./dates";
import type {
  Account,
  Projection,
  ProjectionResult,
  RetirementComparison,
  RetirementProfile,
  RetirementScenario,
} from "./types";

/** Simulation ceiling, so a pathological age range can never spin forever. */
const MAX_YEARS = 100;

/**
 * Years a retirement has to last to count as one. Without this, a plan that
 * can't fund retirement at all still "succeeds" in the last year or two of the
 * horizon, where one or two years of spending is trivially affordable against
 * a lifetime of saving — an answer that is arithmetically true and useless.
 */
const MIN_RETIREMENT_YEARS = 5;

/** The age a 401k opens up without penalty, which `taxable-first` waits for. */
const QUALIFIED_AGE = 59.5;

/**
 * The 2026 elective deferral limit. Shown as a warning on an account that
 * exceeds it — never applied to the math, since taxes are a later stage.
 */
export const DEFERRAL_LIMIT = 24500;
export const CATCH_UP_LIMIT = 7500;
export const CATCH_UP_AGE = 50;

/** The outlook every scenario is measured against: today's returns, holding steady. */
export const BASELINE_SCENARIO: RetirementScenario = {
  id: "__baseline__",
  name: "Baseline outlook",
  marketShift: 0,
  inflation: 2.5,
  colaIncrease: 0,
  annualSpend: 85000,
  withdrawal: "lowest-return-first",
};

/** The 401k contribution ceiling at a given age, catch-up included. */
export function deferralLimitAt(age: number): number {
  return age >= CATCH_UP_AGE ? DEFERRAL_LIMIT + CATCH_UP_LIMIT : DEFERRAL_LIMIT;
}

/**
 * How far a 401k's yearly contribution runs past the limit, or null when it
 * doesn't. Display only: the projection deliberately ignores this.
 */
export function overDeferralLimit(account: Account, currentAge: number): number | null {
  if (account.kind !== "401k") return null;
  const yearly = (Number(account.monthlyContribution) || 0) * 12;
  const limit = deferralLimitAt(currentAge);
  return yearly > limit ? yearly - limit : null;
}

/** A scenario's return for one account, in decimal form. */
function effectiveReturn(account: Account, scenario: RetirementScenario): number {
  const rate = (Number(account.returnRate) || 0) + (Number(scenario.marketShift) || 0);
  // Clamped at zero: a deep bear shift should flatten growth, not invert it.
  return Math.max(0, rate) / 100;
}

/** Bisection steps for `affordableSpend` — 40 halvings resolve to cents. */
const SOLVE_STEPS = 40;

/** The employer's contribution for one year, which only a 401k earns. */
function matchFor(account: Account, contribution: number, salary: number): number {
  if (account.kind !== "401k") return 0;
  const eligible = Math.min(contribution, salary * ((Number(account.matchLimitPct) || 0) / 100));
  return Math.max(0, eligible) * ((Number(account.matchRate) || 0) / 100);
}

/**
 * Pulls one year's spending out of the balances, in the order the scenario
 * asks for, and reports what it actually managed to withdraw.
 */
function withdraw(
  balances: number[],
  accounts: Account[],
  rates: number[],
  need: number,
  strategy: RetirementScenario["withdrawal"],
  age: number,
): number {
  if (need <= 0) return 0;

  if (strategy === "proportional") {
    const total = balances.reduce((sum, balance) => sum + balance, 0);
    if (total <= 0) return 0;
    const taken = Math.min(need, total);
    for (let index = 0; index < balances.length; index += 1) {
      balances[index] -= taken * (balances[index] / total);
    }
    return taken;
  }

  // Both remaining strategies drain accounts one at a time; only the order differs.
  const order = accounts.map((_, index) => index);

  if (strategy === "lowest-return-first") {
    // Spend the slowest-growing money first, so the best compounding runs longest.
    order.sort((a, b) => rates[a] - rates[b]);
  } else {
    // taxable-first: cash, then brokerage, and the 401k only once it's penalty-free.
    const rank = (index: number) => {
      const kind = accounts[index].kind;
      if (kind === "cash") return 0;
      if (kind === "investment") return 1;
      // Ranked last while locked, but still reachable — a plan that would
      // otherwise fail should show the early withdrawal, not a false shortfall.
      return age >= QUALIFIED_AGE ? 2 : 3;
    };
    order.sort((a, b) => rank(a) - rank(b) || rates[a] - rates[b]);
  }

  let remaining = need;
  for (const index of order) {
    if (remaining <= 0) break;
    const taken = Math.min(remaining, balances[index]);
    balances[index] -= taken;
    remaining -= taken;
  }

  return need - remaining;
}

/** One full life run: work until `retireAt`, then live off the balances to `endAge`. */
interface Run {
  balances: number[];
  balancesByAccount: number[][];
  contributionsByYear: number[];
  matchByYear: number[];
  growthByYear: number[];
  withdrawalsByYear: number[];
  depletionAge: number | null;
}

function run(
  profile: RetirementProfile,
  scenario: RetirementScenario,
  spending: number[],
  retireAt: number,
  years: number,
): Run {
  const accounts = profile.accounts;
  const rates = accounts.map((account) => effectiveReturn(account, scenario));
  const inflation = (Number(scenario.inflation) || 0) / 100;

  const balances = accounts.map((account) => Number(account.balance) || 0);
  const balancesByAccount = accounts.map((_, index) => [balances[index]]);
  const totals = [balances.reduce((sum, balance) => sum + balance, 0)];

  const contributionsByYear: number[] = [];
  const matchByYear: number[] = [];
  const growthByYear: number[] = [];
  const withdrawalsByYear: number[] = [];

  let depletionAge: number | null = null;

  for (let year = 0; year < years; year += 1) {
    const age = (Number(profile.currentAge) || 0) + year;
    const working = year < retireAt;
    const salary = (Number(profile.salary) || 0) * Math.pow(1 + inflation, year);

    let contributed = 0;
    let matched = 0;
    let grown = 0;
    let withdrawn = 0;

    if (working) {
      for (let index = 0; index < accounts.length; index += 1) {
        const account = accounts[index];
        const step = (Number(account.contributionGrowth) || 0) / 100;
        const contribution =
          (Number(account.monthlyContribution) || 0) * 12 * Math.pow(1 + step, year);
        const match = matchFor(account, contribution, salary);

        // Growth on the mid-year balance, so a year's contributions earn a
        // partial year of return rather than all of it or none.
        const added = contribution + match;
        const growth = (balances[index] + added / 2) * rates[index];

        balances[index] += added + growth;
        contributed += contribution;
        matched += match;
        grown += growth;
      }
    } else {
      withdrawn = withdraw(
        balances,
        accounts,
        rates,
        spending[year],
        scenario.withdrawal,
        age,
      );

      for (let index = 0; index < accounts.length; index += 1) {
        // Same mid-year convention, applied to the money drawn out.
        const growth = Math.max(0, balances[index]) * rates[index];
        balances[index] += growth;
        grown += growth;
      }

      if (withdrawn + 0.005 < spending[year] && depletionAge === null) {
        depletionAge = age;
      }
    }

    for (let index = 0; index < accounts.length; index += 1) {
      balances[index] = Math.max(0, balances[index]);
      balancesByAccount[index].push(balances[index]);
    }

    totals.push(balances.reduce((sum, balance) => sum + balance, 0));
    contributionsByYear.push(contributed);
    matchByYear.push(matched);
    growthByYear.push(grown);
    withdrawalsByYear.push(withdrawn);
  }

  return {
    balances: totals,
    balancesByAccount,
    contributionsByYear,
    matchByYear,
    growthByYear,
    withdrawalsByYear,
    depletionAge,
  };
}

/**
 * The most you could spend in `retireAt`'s own year if you stopped working
 * then and the money ran out exactly at the horizon. The whole spending path
 * is scaled by one factor, so the answer keeps the shape of the real path —
 * inflation, lifestyle creep, and the mortgage dropping off — and only its
 * height is solved for. Bisected because the simulation isn't invertible.
 */
function affordableSpend(
  profile: RetirementProfile,
  scenario: RetirementScenario,
  spending: number[],
  retireAt: number,
  years: number,
): number {
  const survives = (scale: number) =>
    run(
      profile,
      scenario,
      spending.map((value) => value * scale),
      retireAt,
      years,
    ).depletionAge === null;

  // Find a scale the plan cannot carry, so the answer is bracketed.
  let high = 1;
  for (let step = 0; step < SOLVE_STEPS && survives(high); step += 1) high *= 2;
  if (survives(high)) return spending[retireAt] * high;

  let low = 0;
  for (let step = 0; step < SOLVE_STEPS; step += 1) {
    const mid = (low + high) / 2;
    if (survives(mid)) low = mid;
    else high = mid;
  }

  return spending[retireAt] * low;
}

/**
 * Finds the earliest age you can retire and still have money at `endAge`, then
 * reports the full year-by-year path of that plan.
 */
export function project(
  profile: RetirementProfile,
  scenario: RetirementScenario,
): ProjectionResult {
  const currentAge = Number(profile.currentAge) || 0;
  const endAge = Number(profile.endAge) || 0;
  const years = endAge - currentAge;

  if (years <= 0) {
    return {
      ok: false,
      reason: "The age your money has to last to needs to be past your age today.",
    };
  }
  if (years > MAX_YEARS) {
    return { ok: false, reason: `That's more than ${MAX_YEARS} years to project. Narrow the range.` };
  }
  if (profile.accounts.length === 0) {
    return { ok: false, reason: "Add an account to see a projection." };
  }

  const hasMoney = profile.accounts.some(
    (account) => (Number(account.balance) || 0) > 0 || (Number(account.monthlyContribution) || 0) > 0,
  );
  if (!hasMoney) {
    return {
      ok: false,
      reason: "Give an account a balance or a monthly contribution to see a projection.",
    };
  }
  if ((Number(scenario.annualSpend) || 0) <= 0) {
    return { ok: false, reason: "Enter what you expect a year of retirement to cost." };
  }

  // What each year costs, inflating, with the mortgage dropping out at payoff.
  const start = parseMonth(profile.start);
  const creep =
    ((Number(scenario.inflation) || 0) + (Number(scenario.colaIncrease) || 0)) / 100;
  const mortgageYearly = (Number(profile.mortgagePayment) || 0) * 12;
  const mortgageYears = profile.mortgagePayoff
    ? Math.max(0, monthsBetween(start, parseMonth(profile.mortgagePayoff)) / 12)
    : years;

  const spending: number[] = [];
  for (let year = 0; year < years; year += 1) {
    const base = (Number(scenario.annualSpend) || 0) * Math.pow(1 + creep, year);
    spending.push(base + (year < mortgageYears ? mortgageYearly : 0));
  }

  // Try each retirement year in turn; the first one whose money reaches
  // `endAge` is the answer. At most a few thousand cheap iterations.
  //
  // Candidates stop `MIN_RETIREMENT_YEARS` short of the horizon: the last few
  // years always "succeed" simply because barely any retirement is left to
  // fund. Falling past them is the shortfall case, and the figures then
  // describe working the whole way through.
  const lastCandidate = Math.max(0, years - MIN_RETIREMENT_YEARS);
  let chosen = years;
  let result = run(profile, scenario, spending, years, years);
  let shortfall = true;

  // What retiring in each year would let you spend, on the same terms the
  // solver tests: scale the whole spending path until the money lands exactly
  // on zero at `endAge`, and record that year's share of it. Because it comes
  // from the simulation rather than a formula standing in for it, the year this
  // first covers the cost of living is exactly the retirement age below — the
  // chart draws the verdict instead of arguing with it.
  const sustainableDrawByYear: number[] = [];

  for (let retireAt = 0; retireAt < years; retireAt += 1) {
    // Past the last real candidate the draw runs away — one year left means
    // spending the whole balance in it — so the line is held flat there rather
    // than crossing in years the solver itself refuses to consider.
    sustainableDrawByYear.push(
      retireAt <= lastCandidate
        ? affordableSpend(profile, scenario, spending, retireAt, years)
        : sustainableDrawByYear[sustainableDrawByYear.length - 1] ?? 0,
    );

    if (!shortfall || retireAt > lastCandidate) continue;
    const attempt = run(profile, scenario, spending, retireAt, years);
    if (attempt.depletionAge === null) {
      chosen = retireAt;
      result = attempt;
      shortfall = false;
    }
  }

  const sum = (series: number[]) => series.reduce((total, value) => total + value, 0);

  return {
    ok: true,
    retirementAge: currentAge + chosen,
    retirementYearIndex: chosen,
    retirementDate: addMonths(start, chosen * 12),
    shortfall,
    balances: result.balances,
    balancesByAccount: result.balancesByAccount,
    contributionsByYear: result.contributionsByYear,
    matchByYear: result.matchByYear,
    growthByYear: result.growthByYear,
    withdrawalsByYear: result.withdrawalsByYear,
    spendingByYear: spending,
    sustainableDrawByYear,
    peakBalance: Math.max(...result.balances),
    endingBalance: result.balances[result.balances.length - 1],
    totalContributed: sum(result.contributionsByYear),
    totalMatch: sum(result.matchByYear),
    totalGrowth: sum(result.growthByYear),
    depletionAge: result.depletionAge,
  };
}

/** Measures a scenario against the baseline outlook. */
export function compare(baseline: Projection, scenario: Projection): RetirementComparison {
  const spent = (projection: Projection) =>
    projection.withdrawalsByYear.reduce((total, value) => total + value, 0);

  return {
    yearsEarlier: baseline.retirementAge - scenario.retirementAge,
    balanceDelta: scenario.endingBalance - baseline.endingBalance,
    spendDelta: spent(scenario) - spent(baseline),
  };
}
