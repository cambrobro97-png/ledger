import { formatMoney } from "./format";
import type { Account, AccountKind, RetirementScenario, WithdrawalStrategy } from "./types";

export const ACCOUNT_KIND_OPTIONS: { value: AccountKind; label: string }[] = [
  { value: "401k", label: "401(k)" },
  { value: "investment", label: "Investment fund" },
  { value: "cash", label: "Cash savings" },
];

export const WITHDRAWAL_OPTIONS: { value: WithdrawalStrategy; label: string }[] = [
  { value: "lowest-return-first", label: "Slowest growth first" },
  { value: "proportional", label: "Evenly across accounts" },
  { value: "taxable-first", label: "Taxable first, 401(k) last" },
];

/** What each strategy actually does, for the card's footnote. */
export const WITHDRAWAL_NOTES: Record<WithdrawalStrategy, string> = {
  "lowest-return-first":
    "Spends the slowest-growing money first, leaving the best compounding untouched longest.",
  proportional: "Draws from every account in proportion to its balance, holding the mix steady.",
  "taxable-first": "Lives off cash and investments until 59½, then opens up the 401(k).",
};

export function accountKindLabel(kind: AccountKind): string {
  return ACCOUNT_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? kind;
}

/** True when a scenario leaves the market exactly as it stands today. */
export function isBaselineOutlook(scenario: RetirementScenario): boolean {
  return (Number(scenario.marketShift) || 0) === 0;
}

/** Plain-language summary of an account, e.g. "$310,000 at 7%, $1,200 a month". */
export function describeAccount(account: Account): string {
  const parts = [`${formatMoney(account.balance)} at ${Number(account.returnRate) || 0}%`];

  if ((Number(account.monthlyContribution) || 0) > 0) {
    parts.push(`${formatMoney(account.monthlyContribution)} a month`);
    if ((Number(account.contributionGrowth) || 0) > 0) {
      parts.push(`rising ${Number(account.contributionGrowth)}% a year`);
    }
  } else {
    parts.push("nothing going in");
  }

  if (account.kind === "401k" && (Number(account.matchRate) || 0) > 0) {
    parts.push(
      `matched ${Number(account.matchRate)}% up to ${Number(account.matchLimitPct) || 0}% of pay`,
    );
  }

  return joinParts(parts);
}

/** Plain-language summary of an outlook, e.g. "3 points off returns, 3.5% inflation, $85,000 a year". */
export function describeScenario(scenario: RetirementScenario): string {
  const parts: string[] = [];
  const shift = Number(scenario.marketShift) || 0;

  if (shift > 0) parts.push(`${shift} points onto returns`);
  else if (shift < 0) parts.push(`${Math.abs(shift)} points off returns`);
  else parts.push("returns as they stand");

  const creep = Number(scenario.colaIncrease) || 0;
  parts.push(
    creep > 0
      ? `${Number(scenario.inflation) || 0}% inflation plus ${creep}% creep`
      : `${Number(scenario.inflation) || 0}% inflation`,
  );
  parts.push(`${formatMoney(scenario.annualSpend)} a year`);

  return joinParts(parts);
}

function joinParts(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
