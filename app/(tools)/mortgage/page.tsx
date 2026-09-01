"use client";

import { useCallback, useEffect, useState } from "react";
import { useSiteChrome } from "@/components/SiteChrome";
import { TopBar } from "@/components/TopBar";
import { LoanPanel } from "@/components/LoanPanel";
import { ScenarioTabs } from "@/components/ScenarioTabs";
import { Hero } from "@/components/Hero";
import { TermRibbon } from "@/components/TermRibbon";
import { MetricStrip } from "@/components/MetricStrip";
import { BalanceChart } from "@/components/charts/BalanceChart";
import { InterestChart } from "@/components/charts/InterestChart";
import { YearSplitChart } from "@/components/charts/YearSplitChart";
import { ScenarioEditor } from "@/components/ScenarioEditor";
import { useMortgageModel } from "@/hooks/useMortgageModel";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TWEEN_MS } from "@/hooks/useTween";
import styles from "./page.module.css";

export default function Page() {
  const model = useMortgageModel();
  const reducedMotion = useReducedMotion();
  const [presenting, setPresenting] = useState(false);
  const { setChromeVisible } = useSiteChrome();

  // Presenting takes over the screen, so the site tab bar steps aside.
  useEffect(() => {
    setChromeVisible(!presenting);
    return () => setChromeVisible(true);
  }, [presenting, setChromeVisible]);

  const duration = reducedMotion ? 0 : TWEEN_MS;
  const togglePresent = useCallback(() => setPresenting((value) => !value), []);
  const exitPresent = useCallback(() => setPresenting(false), []);

  useKeyboardControls({
    presenting,
    onTogglePresent: togglePresent,
    onExitPresent: exitPresent,
    onStep: model.stepScenario,
  });

  const { baseline, current, comparison } = model;
  const ready = baseline !== null && current !== null && comparison !== null;

  return (
    <main className={`${styles.wrap} ${presenting ? styles.wrapPresenting : ""}`}>
      <TopBar presenting={presenting} onModeChange={setPresenting} />

      <LoanPanel
        loan={model.loan}
        baselineMonths={baseline?.months ?? null}
        presenting={presenting}
        onChange={model.setLoanField}
        pmi={model.pmi}
        current={current}
        onPmiChange={model.setPmiField}
      />

      {model.error ? <p className={styles.warning}>{model.error}</p> : null}

      {ready ? (
        <>
          <ScenarioTabs
            scenarios={model.scenarios}
            activeId={model.activeId}
            presenting={presenting}
            onSelect={model.selectScenario}
          />

          <Hero
            scenario={model.activeScenario}
            baseline={baseline}
            current={current}
            monthsSaved={comparison.monthsSaved}
          />

          <TermRibbon
            startMonth={model.loan.start}
            baseline={baseline}
            current={current}
            monthsSaved={comparison.monthsSaved}
          />

          <MetricStrip
            startMonth={model.loan.start}
            baseline={baseline}
            current={current}
            comparison={comparison}
            duration={duration}
          />

          <div className={styles.charts}>
            <BalanceChart
              baseline={baseline}
              current={current}
              length={baseline.months}
              startMonth={model.loan.start}
              duration={duration}
            />
            <InterestChart
              baseline={baseline}
              current={current}
              length={baseline.months}
              startMonth={model.loan.start}
              duration={duration}
            />
            <YearSplitChart
              className={styles.chartsWide}
              current={current}
              length={baseline.months}
              startMonth={model.loan.start}
              duration={duration}
            />
          </div>
        </>
      ) : null}

      {!presenting ? (
        <>
          <ScenarioEditor model={model} />
          <p className={styles.footnote}>
            Figures cover principal and interest only &mdash; taxes, insurance, and escrow are
            excluded because extra payments don&rsquo;t change them.{" "}
            {model.pmi.enabled ? (
              <>
                PMI is escrow too, so the premium stays out of the interest totals; what it
                contributes here is the month it stops, and the principal it pays down after that.
                Lenders drop it automatically at 78% LTV on the original schedule and will usually
                cancel at 80% on request &mdash; both on the appraised value at closing, so a
                current-value estimate is your own projection rather than a promise.{" "}
              </>
            ) : null}
            Every scenario is compared against making no extra payments at all. Press{" "}
            <kbd>P</kbd> to present, <kbd>&larr;</kbd> <kbd>&rarr;</kbd> to move between scenarios.
          </p>
        </>
      ) : null}
    </main>
  );
}
