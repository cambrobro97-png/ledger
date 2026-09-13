"use client";

import { useCallback, useEffect, useState } from "react";
import { useSiteChrome } from "@/components/SiteChrome";
import { ToolHead } from "@/components/ToolHead";
import { ToolPage, ToolFootnote, Warning } from "@/components/ToolPage";
import { ProfilePanel } from "@/components/retirement/ProfilePanel";
import { RedirectPanel } from "@/components/retirement/RedirectPanel";
import { OutlookTabs } from "@/components/retirement/OutlookTabs";
import { RetirementHero } from "@/components/retirement/RetirementHero";
import { AgeRibbon } from "@/components/retirement/AgeRibbon";
import { RetirementMetrics } from "@/components/retirement/RetirementMetrics";
import { PortfolioChart } from "@/components/retirement/charts/PortfolioChart";
import { AccountsChart } from "@/components/retirement/charts/AccountsChart";
import { CrossoverChart } from "@/components/retirement/charts/CrossoverChart";
import { GrowthChart } from "@/components/retirement/charts/GrowthChart";
import { AccountEditor } from "@/components/retirement/AccountEditor";
import { createRedirect } from "@/lib/defaults";
import { OutlookEditor } from "@/components/retirement/OutlookEditor";
import { useRetirementModel } from "@/hooks/useRetirementModel";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TWEEN_MS } from "@/hooks/useTween";
import { parseMonth } from "@/lib/dates";

export default function Page() {
  const model = useRetirementModel();
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

  const { profile, baseline, current, comparison } = model;
  const ready = baseline !== null && current !== null && comparison !== null;

  // Every series runs the full horizon, so the axis holds still while the
  // charts tween between outlooks.
  const horizon = Math.max(1, profile.endAge - profile.currentAge);
  const startYear = parseMonth(profile.start).year;

  return (
    <ToolPage presenting={presenting}>
      <ToolHead
        eyebrow="Contributions and growth &mdash; when they add up"
        title="The year work becomes optional"
        presenting={presenting}
        onExitPresenting={() => setPresenting(false)}
      />

      <ProfilePanel
        profile={profile}
        retirementAge={current && !current.shortfall ? current.retirementAge : null}
        presenting={presenting}
        mortgage={model.mortgage}
        resolution={model.mortgageResolution}
        income={model.income}
        salaryResolution={model.salaryResolution}
        onChange={model.setProfileField}
        onLink={model.linkMortgage}
        onLinkSalary={model.linkSalary}
      />

      {!presenting ? (
        <RedirectPanel
          profile={profile}
          redirect={profile.redirect ?? createRedirect()}
          current={current}
          withoutRedirect={model.withoutRedirect}
          onChange={model.setRedirectField}
        />
      ) : null}

      {model.error ? <Warning>{model.error}</Warning> : null}

      {ready ? (
        <>
          <OutlookTabs
            scenarios={model.scenarios}
            activeId={model.activeId}
            presenting={presenting}
            onSelect={model.selectScenario}
          />

          <RetirementHero
            scenario={model.activeScenario}
            profile={profile}
            current={current}
            annualSpend={model.activeSpend.annual}
            yearsEarlier={comparison.yearsEarlier}
          />

          <AgeRibbon profile={profile} current={current} />

          <RetirementMetrics
            profile={profile}
            baseline={baseline}
            current={current}
            comparison={comparison}
            withoutRedirect={model.withoutRedirect}
            duration={duration}
          />

          <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <PortfolioChart
              baseline={baseline}
              current={current}
              length={horizon}
              startYear={startYear}
              currentAge={profile.currentAge}
              duration={duration}
            />
            <CrossoverChart
              current={current}
              length={horizon}
              startYear={startYear}
              currentAge={profile.currentAge}
              duration={duration}
            />
            <AccountsChart
              className="col-span-full"
              accounts={profile.accounts}
              current={current}
              length={horizon}
              startYear={startYear}
              currentAge={profile.currentAge}
              duration={duration}
            />
            <GrowthChart
              className="col-span-full"
              current={current}
              length={horizon}
              startYear={startYear}
              currentAge={profile.currentAge}
              duration={duration}
            />
          </div>
        </>
      ) : null}

      {!presenting ? (
        <>
          <AccountEditor model={model} />
          <OutlookEditor model={model} />
          <ToolFootnote>
            Taxes and Social Security are not modelled yet &mdash; contributions and withdrawals are
            counted gross, and 401(k) limits are flagged but never enforced. Retirement age is the
            earliest one whose money still reaches the age you set, and every outlook is measured
            against the market exactly as it stands today. Press <kbd>P</kbd> to present,{" "}
            <kbd>&larr;</kbd> <kbd>&rarr;</kbd> to move between outlooks.
          </ToolFootnote>
        </>
      ) : null}
    </ToolPage>
  );
}
