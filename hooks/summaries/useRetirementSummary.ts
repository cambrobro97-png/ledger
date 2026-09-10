"use client";

import { useMemo } from "react";
import { BASELINE_SCENARIO, compare, project } from "@/lib/retirement";
import { RETIREMENT_STORAGE_KEY, createDefaultRetirementState } from "@/lib/defaults";
import { resolveRetirementMortgage } from "@/lib/links";
import type {
  Projection,
  RetirementComparison,
  RetirementProfile,
  RetirementState,
} from "@/lib/types";
import { useMortgageSummary } from "./useMortgageSummary";
import { usePersistedState } from "../usePersistedState";

export interface RetirementSummary {
  hydrated: boolean;
  /** The outlook the retirement tool itself has selected. */
  outlookName: string;
  /** Your age today, which is what turns a series index back into an age. */
  currentAge: number;
  /** The age the projection runs to, for "…left at N". */
  endAge: number;
  baseline: Projection | null;
  current: Projection | null;
  comparison: RetirementComparison | null;
  error: string | null;
}

/**
 * Read-only retirement figures for the dashboard. See `useMortgageSummary`.
 *
 * A linked mortgage is resolved here too, for the same reason the expense
 * summary resolves its links: a card reading the stored profile would project
 * against whatever payoff date was true when it was linked.
 */
export function useRetirementSummary(): RetirementSummary {
  const { value: state, hydrated } = usePersistedState<RetirementState>(
    RETIREMENT_STORAGE_KEY,
    createDefaultRetirementState,
    { readOnly: true },
  );

  const mortgageSummary = useMortgageSummary();
  const mortgage = mortgageSummary.hydrated ? mortgageSummary : null;

  return useMemo(() => {
    const scenario =
      state.scenarios.find((candidate) => candidate.id === state.activeId) ?? state.scenarios[0];

    // The baseline keeps the active outlook's spending and inflation, so the
    // comparison isolates what the market shift alone is worth. Same blend the
    // retirement tool uses; the two must agree or the dashboard would quote a
    // different saving than the page it links to.
    const baselineScenario = {
      ...BASELINE_SCENARIO,
      inflation: scenario.inflation,
      colaIncrease: scenario.colaIncrease,
      annualSpend: scenario.annualSpend,
      withdrawal: scenario.withdrawal,
    };

    const linked = resolveRetirementMortgage(state.profile, mortgage);
    const profile: RetirementProfile = state.profile.mortgageLink
      ? { ...state.profile, mortgagePayment: linked.payment, mortgagePayoff: linked.payoff }
      : state.profile;

    const baselineResult = project(profile, baselineScenario);
    const currentResult = project(profile, scenario);

    const baseline = baselineResult.ok ? baselineResult : null;
    const current = currentResult.ok ? currentResult : null;

    return {
      hydrated,
      outlookName: scenario?.name ?? "",
      currentAge: state.profile.currentAge,
      endAge: state.profile.endAge,
      baseline,
      current,
      comparison: baseline && current ? compare(baseline, current) : null,
      error: baselineResult.ok
        ? currentResult.ok
          ? null
          : currentResult.reason
        : baselineResult.reason,
    };
  }, [state, hydrated, mortgage]);
}
