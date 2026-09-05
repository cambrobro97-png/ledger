"use client";

import { useExpenseSummary } from "@/hooks/summaries/useExpenseSummary";
import { useIncomeSummary } from "@/hooks/summaries/useIncomeSummary";
import { MONTH_NAMES } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { ColumnChart } from "../ColumnChart";
import { WidgetShell } from "../WidgetShell";

/**
 * Which months actually clear, and which ones don't.
 *
 * The cash-flow widget answers the year in one figure; this answers the shape
 * of it. A year that nets out comfortably can still have three months in the
 * red, and nothing else on the dashboard would say so.
 */
export function MonthlySurplusWidget({ size }: WidgetProps) {
  const income = useIncomeSummary();
  const expenses = useExpenseSummary();

  const hydrated = income.hydrated && expenses.hydrated;
  const net = income.derived.byMonth.map(
    (amount, month) => amount - expenses.derived.byMonth[month],
  );

  /*
   * A month with neither income nor spending recorded is not a month that broke
   * even — it is a month nothing has been entered for. Counting those as
   * cleared would report "12 of 12" on a year half filled in, so they are left
   * out of both sides of the count.
   */
  const active = net
    .map((_, month) => month)
    .filter((month) => income.derived.byMonth[month] > 0 || expenses.derived.byMonth[month] > 0);

  const black = active.filter((month) => net[month] >= 0).length;
  const tightest = active.reduce(
    (worst, month) => (worst === -1 || net[month] < net[worst] ? month : worst),
    -1,
  );

  // The two tools carry their own year, and nothing keeps them in step. Same
  // caveat the cash-flow widget makes, for the same reason.
  const mismatched = income.year !== expenses.year;
  const clear = active.length > 0 && black === active.length;

  const detail =
    tightest === -1
      ? "Nothing scheduled yet"
      : clear
        ? `Tightest ${MONTH_NAMES[tightest]}, ${formatMoney(net[tightest])} to spare`
        : `${MONTH_NAMES[tightest]} is worst at ${formatMoney(net[tightest])}`;

  return (
    <WidgetShell
      eyebrow={`Income vs spending · ${income.year}`}
      title="Months in the black"
      value={active.length === 0 ? "—" : `${black}/${active.length}`}
      detail={detail}
      accent={clear ? "var(--jade)" : "var(--crimson)"}
      hydrated={hydrated}
      note={mismatched ? `Spending shown for ${expenses.year}` : undefined}
    >
      {size !== "small" && active.length > 0 ? (
        <ColumnChart
          values={net}
          positive="var(--jade)"
          negative="var(--crimson)"
          months
          label="What is left over each month, above and below break-even"
        />
      ) : null}
    </WidgetShell>
  );
}
