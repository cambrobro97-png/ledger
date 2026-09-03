"use client";

import { useCallback, useMemo, useState } from "react";
import { ExpenseEditor } from "@/components/expenses/ExpenseEditor";
import { ExpenseMetrics } from "@/components/expenses/ExpenseMetrics";
import { MonthDetail } from "@/components/timeline/MonthDetail";
import { Timeline } from "@/components/timeline/Timeline";
import { YearSwitcher } from "@/components/timeline/YearSwitcher";
import type { BandScale, TimelineAppearance } from "@/components/timeline/types";
import { Panel } from "@/components/ui/Panel";
import { useExpenseModel } from "@/hooks/useExpenseModel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TWEEN_MS } from "@/hooks/useTween";
import { MONTH_NAMES } from "@/lib/dates";
import { CADENCE_LABELS, CATEGORY_LABELS, KIND_LABELS, categoryAccent } from "@/lib/expenses";
import { formatMoney } from "@/lib/format";
import monthStyles from "@/components/timeline/MonthDetail.module.css";
import headStyles from "@/components/TopBar.module.css";
import styles from "../tool-page.module.css";

export default function Page() {
  const model = useExpenseModel();
  const reducedMotion = useReducedMotion();
  const [zoomMonth, setZoomMonth] = useState<number | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const duration = reducedMotion ? 0 : TWEEN_MS;
  const zoomOut = useCallback(() => setZoomMonth(null), []);

  const itemsById = useMemo(
    () => new Map(model.items.map((item) => [item.id, item])),
    [model.items],
  );

  const appearance = useCallback<(id: string) => TimelineAppearance>(
    (id) => {
      const item = itemsById.get(id);
      return { accent: categoryAccent(item?.category ?? "other"), muted: item?.kind === "variable" };
    },
    [itemsById],
  );

  const nameOf = useCallback((id: string) => itemsById.get(id)?.name || "Expense", [itemsById]);

  const describe = useCallback(
    (id: string) => {
      const item = itemsById.get(id);
      if (!item) return null;
      return `${CATEGORY_LABELS[item.category]} · ${KIND_LABELS[item.kind].toLowerCase()} · ${CADENCE_LABELS[item.cadence].toLowerCase()}`;
    },
    [itemsById],
  );

  // A fact about the data, not the chart: the band shades between the lightest
  // and heaviest spending month. Spending rarely nears zero, so measured from
  // zero the whole year lands in the top of the range as identical blocks.
  const bandScale = useMemo<BandScale>(() => {
    const spending = model.derived.byMonth.filter((amount) => amount > 0);
    if (spending.length === 0) return { kind: "range", low: 0, high: 1 };
    return { kind: "range", low: Math.min(...spending), high: Math.max(...spending) };
  }, [model.derived.byMonth]);

  // The meta line under each item in the open month.
  const monthLineMeta = useCallback(
    (id: string, datesSummary: string) => {
      const item = itemsById.get(id);
      if (!item) return datesSummary;
      return `${CATEGORY_LABELS[item.category]}${item.kind === "variable" ? " · variable" : ""} · ${datesSummary}`;
    },
    [itemsById],
  );

  return (
    <main className={styles.wrap}>
      <header className={`${headStyles.bar} ${styles.head}`}>
        <div>
          <div className={headStyles.eyebrow}>Every bill &mdash; what the year really costs</div>
          <h1 className={headStyles.title}>Where the money goes</h1>
        </div>
      </header>

      <Panel>
        <YearSwitcher
          year={model.year}
          zoomMonth={zoomMonth}
          onStepYear={model.stepYear}
          onZoomOut={zoomOut}
        />

        <Timeline
          year={model.year}
          data={model.derived}
          appearance={appearance}
          nameOf={nameOf}
          describe={describe}
          peerNoun={{ one: "expense", many: "expenses" }}
          emptyMessage={`Nothing lands in ${model.year} yet — add an expense below.`}
          bandColor="var(--crimson)"
          bandScale={bandScale}
          title={`Expenses across ${model.year}`}
          zoomMonth={zoomMonth}
          onZoomMonth={setZoomMonth}
          hoveredItemId={hoveredItemId}
          onHoverItem={setHoveredItemId}
          duration={duration}
        />

        {/* The open month lists itself out under the timeline, so a column can
            be read as the bills that make it up rather than a height. */}
        {zoomMonth === null ? null : (
          <MonthDetail
            key={zoomMonth}
            month={zoomMonth}
            year={model.year}
            occurrences={model.derived.occurrences}
            total={model.derived.byMonth[zoomMonth]}
            appearance={appearance}
            nameOf={nameOf}
            describe={monthLineMeta}
            stats={
              <ExpenseMonthStats
                month={zoomMonth}
                derived={model.derived}
                isVariable={(id) => itemsById.get(id)?.kind === "variable"}
              />
            }
            hoveredItemId={hoveredItemId}
            onHoverItem={setHoveredItemId}
          />
        )}
      </Panel>

      <ExpenseMetrics
        year={model.year}
        derived={model.derived}
        items={model.items}
        duration={duration}
      />

      <ExpenseEditor model={model} hoveredItemId={hoveredItemId} onHoverItem={setHoveredItemId} />

      <p className={styles.footnote}>
        Fixed lines are the ones a lean month can&rsquo;t go below; everything marked variable is
        where there&rsquo;s a decision to make. Recurring expenses repeat from their first payment,
        so a weekly bill produces the occasional five-payment month
        {model.derived.peakMonth === -1 ? "" : `, like ${MONTH_NAMES[model.derived.peakMonth]}`}.
        Press <kbd>Esc</kbd> to close an open month.
      </p>
    </main>
  );
}

/** The expense header stats for an open month: fixed / variable / vs-average. */
function ExpenseMonthStats({
  month,
  derived,
  isVariable,
}: {
  month: number;
  derived: ReturnType<typeof useExpenseModel>["derived"];
  isVariable: (itemId: string) => boolean;
}) {
  const total = derived.byMonth[month];
  // Fixed vs variable, summed off the month's own occurrences so the header
  // matches the lines below it.
  const fixed = derived.occurrences.reduce((sum, occurrence) => {
    if (occurrence.day.month !== month || isVariable(occurrence.itemId)) return sum;
    return sum + occurrence.amount;
  }, 0);

  // Measured against months that actually spend, so a half-filled year doesn't
  // make every month look above average.
  const spendingMonths = derived.byMonth.filter((amount) => amount > 0).length;
  const average = spendingMonths === 0 ? 0 : derived.total / spendingMonths;
  const delta = total - average;

  return (
    <>
      <span className={monthStyles.stat}>
        <strong>{formatMoney(fixed)}</strong> fixed
      </span>
      <span className={monthStyles.stat}>
        <strong>{formatMoney(total - fixed)}</strong> variable
      </span>
      <span
        className={`${monthStyles.stat} ${delta > 0 ? monthStyles.over : monthStyles.under}`}
        title="Against the average month that has spending in it"
      >
        <strong>
          {delta >= 0 ? "+" : "−"}
          {formatMoney(Math.abs(delta))}
        </strong>{" "}
        vs. average
      </span>
    </>
  );
}
