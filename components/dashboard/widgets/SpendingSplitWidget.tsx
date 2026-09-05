"use client";

import { useExpenseSummary } from "@/hooks/summaries/useExpenseSummary";
import { CATEGORY_LABELS, categoryAccent } from "@/lib/expenses";
import { formatMoney, formatPercent } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { Donut } from "../Donut";
import { WidgetShell } from "../WidgetShell";

/** How many categories the legend names before gathering up the rest. */
const NAMED = 4;

/** What the year's spending is actually made of. */
export function SpendingSplitWidget({ size }: WidgetProps) {
  const { hydrated, year, derived } = useExpenseSummary();

  /*
   * `byCategory` arrives in the canonical order the timeline needs, where a
   * category holds its place however much it spends. A ring is read biggest
   * first, so it is sorted here rather than in the shared derivation.
   */
  const ranked = [...derived.byCategory].sort((left, right) => right.total - left.total);
  const heaviest = ranked[0];

  return (
    <WidgetShell
      eyebrow={`Expenses · ${year}`}
      title="Where it goes"
      value={heaviest ? formatMoney(heaviest.total) : "—"}
      detail={
        heaviest
          ? `${CATEGORY_LABELS[heaviest.category]} — ${formatPercent(heaviest.total / derived.total)} of the year`
          : "Nothing scheduled yet"
      }
      accent={heaviest ? categoryAccent(heaviest.category) : "var(--crimson)"}
      hydrated={hydrated}
    >
      {ranked.length > 0 ? (
        <Donut
          segments={ranked.map((entry) => ({
            label: CATEGORY_LABELS[entry.category],
            value: entry.total,
            color: categoryAccent(entry.category),
          }))}
          // A phone gives every card the full column but not much height, so
          // the ring goes on alone there and the legend waits for the room.
          legend={size === "small" ? 0 : NAMED}
          format={formatMoney}
          label="Yearly spending by category"
        />
      ) : null}
    </WidgetShell>
  );
}
