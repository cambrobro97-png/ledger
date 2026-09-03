"use client";

import { useCallback, useMemo, useState } from "react";
import { IncomeEditor } from "@/components/income/IncomeEditor";
import { IncomeMetrics } from "@/components/income/IncomeMetrics";
import { MonthDetail } from "@/components/timeline/MonthDetail";
import { Timeline } from "@/components/timeline/Timeline";
import { YearSwitcher } from "@/components/timeline/YearSwitcher";
import type { BandScale, TimelineAppearance } from "@/components/timeline/types";
import { Panel } from "@/components/ui/Panel";
import { useIncomeModel } from "@/hooks/useIncomeModel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TWEEN_MS } from "@/hooks/useTween";
import { MONTH_NAMES } from "@/lib/dates";
import { CADENCE_LABELS, accentFor } from "@/lib/income";
import { formatMoney } from "@/lib/format";
import monthStyles from "@/components/timeline/MonthDetail.module.css";
import headStyles from "@/components/TopBar.module.css";
import styles from "../tool-page.module.css";

const BAND_SCALE: BandScale = { kind: "share" };

export default function Page() {
  const model = useIncomeModel();
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
    (id) => ({ accent: accentFor(itemsById.get(id)?.accent ?? 0) }),
    [itemsById],
  );

  const nameOf = useCallback((id: string) => itemsById.get(id)?.name || "Income", [itemsById]);

  const describe = useCallback(
    (id: string) => {
      const item = itemsById.get(id);
      return item ? CADENCE_LABELS[item.cadence] : null;
    },
    [itemsById],
  );

  // The meta line under each source in the open month: cadence, then the dates.
  const monthLineMeta = useCallback(
    (id: string, datesSummary: string) => {
      const item = itemsById.get(id);
      return item ? `${CADENCE_LABELS[item.cadence]} · ${datesSummary}` : datesSummary;
    },
    [itemsById],
  );

  return (
    <main className={styles.wrap}>
      <header className={`${headStyles.bar} ${styles.head}`}>
        <div>
          <div className={headStyles.eyebrow}>Every payday &mdash; where the year lands</div>
          <h1 className={headStyles.title}>What the year pays</h1>
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
          peerNoun={{ one: "source", many: "sources" }}
          emptyMessage={`Nothing lands in ${model.year} yet — add income below.`}
          bandColor="var(--jade)"
          bandScale={BAND_SCALE}
          title={`Income across ${model.year}`}
          zoomMonth={zoomMonth}
          onZoomMonth={setZoomMonth}
          hoveredItemId={hoveredItemId}
          onHoverItem={setHoveredItemId}
          duration={duration}
        />

        {/* The open month lists itself out under the timeline, so a payday
            column can be read as the sources that make it up. */}
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
            stats={<IncomeMonthStats month={zoomMonth} derived={model.derived} />}
            hoveredItemId={hoveredItemId}
            onHoverItem={setHoveredItemId}
          />
        )}
      </Panel>

      <IncomeMetrics
        year={model.year}
        derived={model.derived}
        sourceCount={model.items.length}
        duration={duration}
      />

      <IncomeEditor model={model} hoveredItemId={hoveredItemId} onHoverItem={setHoveredItemId} />

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

/** The income header stats for an open month: paydays, and vs the average. */
function IncomeMonthStats({
  month,
  derived,
}: {
  month: number;
  derived: ReturnType<typeof useIncomeModel>["derived"];
}) {
  const total = derived.byMonth[month];
  const payments = derived.occurrences.filter((occurrence) => occurrence.day.month === month).length;

  // Measured against months that actually pay, so a half-filled year doesn't
  // make every month look above average.
  const payingMonths = derived.byMonth.filter((amount) => amount > 0).length;
  const average = payingMonths === 0 ? 0 : derived.total / payingMonths;
  const delta = total - average;

  return (
    <>
      <span className={monthStyles.stat}>
        <strong>{payments}</strong> {payments === 1 ? "payday" : "paydays"}
      </span>
      <span
        className={`${monthStyles.stat} ${delta >= 0 ? monthStyles.under : monthStyles.over}`}
        title="Against the average month that has income in it"
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
