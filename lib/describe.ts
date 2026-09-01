import { MONTH_NAMES } from "./dates";
import { formatMoney } from "./format";
import type { Scenario } from "./types";

/** True when a scenario adds nothing beyond the scheduled payment. */
export function isBaselineLike(scenario: Scenario): boolean {
  return !(
    Number(scenario.monthly) > 0 ||
    Number(scenario.annual) > 0 ||
    scenario.oneTimes.some((payment) => Number(payment.amount) > 0)
  );
}

/** Plain-language summary of what a scenario adds, e.g. "$325 a month and $3,000 every Apr". */
export function describeExtras(scenario: Scenario): string {
  const parts: string[] = [];

  if (Number(scenario.monthly) > 0) {
    parts.push(`${formatMoney(scenario.monthly)} a month`);
  }
  if (Number(scenario.annual) > 0) {
    parts.push(`${formatMoney(scenario.annual)} every ${MONTH_NAMES[Number(scenario.annualMonth) || 0]}`);
  }

  const lumpSums = scenario.oneTimes.filter((payment) => Number(payment.amount) > 0);
  if (lumpSums.length === 1) {
    parts.push(`a one-time ${formatMoney(lumpSums[0].amount)}`);
  } else if (lumpSums.length > 1) {
    parts.push(`${lumpSums.length} one-time payments`);
  }

  if (parts.length === 0) return "nothing extra";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
