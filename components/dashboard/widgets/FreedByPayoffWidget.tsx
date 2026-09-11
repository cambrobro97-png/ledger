"use client";

import { useRetirementSummary } from "@/hooks/summaries/useRetirementSummary";
import { formatMonth, isMonthValue, parseMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { ColumnChart } from "../ColumnChart";
import { WidgetShell } from "../WidgetShell";

/**
 * What the mortgage ending is worth to the accounts.
 *
 * Off by default in the retirement tool, so the card says how to switch it on
 * rather than showing a zero as though it were an answer.
 */
export function FreedByPayoffWidget({ size }: WidgetProps) {
  const retirement = useRetirementSummary();
  const current = retirement.current;
  const redirect = retirement.profile.redirect;

  const monthly = Number(retirement.profile.mortgagePayment) || 0;
  const share = Math.min(100, Math.max(0, Number(redirect?.share) || 0)) / 100;
  const payoff = isMonthValue(retirement.profile.mortgagePayoff)
    ? formatMonth(parseMonth(retirement.profile.mortgagePayoff))
    : null;

  /*
   * Three states, not two. The redirect being switched on is not the same as it
   * having anything to do: retire before the mortgage is paid off and there are
   * no working years left for the freed payment to land in, which is a fact
   * about the plan rather than a setting left untouched.
   */
  const enabled = Boolean(redirect?.enabled);
  const on = enabled && current !== null && current.totalRedirected > 0;
  const idle = enabled && !on;

  return (
    <WidgetShell
      eyebrow={`Retirement · ${retirement.outlookName}`}
      title="Freed by the payoff"
      value={on && current ? formatMoney(current.totalRedirected) : "—"}
      detail={
        on
          ? `${formatMoney(monthly * share)} a month from ${payoff ?? "payoff"}, saved instead of absorbed`
          : idle
            ? `Retirement comes before ${payoff ?? "the payoff"}, so there are no working years left for it`
            : "Switch the redirect on in the retirement tool to see what the payoff is worth"
      }
      accent={on ? "var(--brass)" : "var(--ash)"}
      hydrated={retirement.hydrated}
      note={retirement.error ?? undefined}
    >
      {on && current && size !== "small" ? (
        <ColumnChart
          values={current.redirectedByYear}
          positive="var(--brass)"
          negative="var(--crimson)"
          label="What the freed payment adds each year"
        />
      ) : null}
    </WidgetShell>
  );
}
