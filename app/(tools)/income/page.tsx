"use client";

import { useCallback, useEffect, useState } from "react";
import { IncomeEditor } from "@/components/income/IncomeEditor";
import { IncomeMetrics } from "@/components/income/IncomeMetrics";
import { YearSwitcher } from "@/components/income/YearSwitcher";
import { YearTimeline } from "@/components/income/YearTimeline";
import { Panel } from "@/components/ui/Panel";
import { useIncomeModel } from "@/hooks/useIncomeModel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TWEEN_MS } from "@/hooks/useTween";
import { MONTH_NAMES } from "@/lib/dates";
import { TOOLS } from "@/lib/tools";
import styles from "./page.module.css";

export default function Page() {
  const model = useIncomeModel();
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
        <h1 className={styles.title}>{TOOLS[2].name}</h1>
        <p className={styles.blurb}>
          Every payday of the year on one line. Click a month to open it up.
        </p>
      </header>

      <Panel>
        <YearSwitcher
          year={model.year}
          zoomMonth={zoomMonth}
          onStepYear={model.stepYear}
          onZoomOut={zoomOut}
        />

        <YearTimeline
          year={model.year}
          derived={model.derived}
          items={model.items}
          zoomMonth={zoomMonth}
          onZoomMonth={setZoomMonth}
          hoveredItemId={hoveredItemId}
          onHoverItem={setHoveredItemId}
          duration={duration}
        />
      </Panel>

      <IncomeMetrics
        year={model.year}
        derived={model.derived}
        sourceCount={model.items.length}
        duration={duration}
      />

      <IncomeEditor
        model={model}
        hoveredItemId={hoveredItemId}
        onHoverItem={setHoveredItemId}
      />

      <p className={styles.footnote}>
        Figures are gross &mdash; taxes, deductions, and withholding aren&rsquo;t modelled here.
        Recurring income repeats from its first payment, so pay that lands every two weeks
        produces the occasional three-payday month
        {model.derived.peakMonth === -1 ? "" : `, like ${MONTH_NAMES[model.derived.peakMonth]}`}.
        Press <kbd>Esc</kbd> to close an open month.
      </p>
    </main>
  );
}
