"use client";

import { useMemo } from "react";
import { BASELINE_SCENARIO, compare, project } from "@/lib/retirement";
import { RETIREMENT_STORAGE_KEY, createDefaultRetirementState } from "@/lib/defaults";
import type {
  Projection,
  RetirementComparison,
  RetirementState,
} from "@/lib/types";
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

/** Read-only retirement figures for the dashboard. See `useMortgageSummary`. */
export function useRetirementSummary(): RetirementSummary {
  const { value: state, hydrated } = usePersistedState<RetirementState>(
    RETIREMENT_STORAGE_KEY,
    createDefaultRetirementState,
    { readOnly: true },
  );

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

    const baselineResult = project(state.profile, baselineScenario);
    const currentResult = project(state.profile, scenario);

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
  }, [state, hydrated]);
}
