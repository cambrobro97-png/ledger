"use client";

import { useCallback, useEffect, useState } from "react";
import { ExpenseEditor } from "@/components/expenses/ExpenseEditor";
import { ExpenseMetrics } from "@/components/expenses/ExpenseMetrics";
import { ExpenseTimeline } from "@/components/expenses/ExpenseTimeline";
import { MonthDetail } from "@/components/expenses/MonthDetail";
import { YearSwitcher } from "@/components/income/YearSwitcher";
import { Panel } from "@/components/ui/Panel";
import { useExpenseModel } from "@/hooks/useExpenseModel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TWEEN_MS } from "@/hooks/useTween";
import { MONTH_NAMES } from "@/lib/dates";
import { TOOLS } from "@/lib/tools";
import styles from "./page.module.css";

export default function Page() {
  const model = useExpenseModel();
  const reducedMotion = useReducedMotion();
  const [zoomMonth, setZoomMonth] = useState<number | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const duration = reducedMotion ? 0 : TWEEN_MS;
  const zoomOut = useCallback(() => setZoomMonth(null), []);

  // Escape backs out of a zoomed month, matching how the mortgage tool leaves
  // its presenting mode.
  useEffect(() => {
    if (zoomMonth === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomMonth(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomMonth]);

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <h1 className={styles.title}>{TOOLS[1].name}</h1>
        <p className={styles.blurb}>
          Every bill of the year on one line. Click a month to see what it&rsquo;s made of.
        </p>
      </header>

      <Panel>
        <YearSwitcher
          year={model.year}
          zoomMonth={zoomMonth}
          onStepYear={model.stepYear}
          onZoomOut={zoomOut}
        />

        <ExpenseTimeline
          year={model.year}
          derived={model.derived}
          items={model.items}
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
            derived={model.derived}
            items={model.items}
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

      <ExpenseEditor
        model={model}
        hoveredItemId={hoveredItemId}
        onHoverItem={setHoveredItemId}
      />

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
