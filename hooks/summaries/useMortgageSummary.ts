"use client";

import { useMemo } from "react";
import { BASELINE_SCENARIO, compare, simulate } from "@/lib/amortization";
import { STORAGE_KEY, createDefaultState } from "@/lib/defaults";
import type { Amortization, AppState, Comparison } from "@/lib/types";
import { usePersistedState } from "../usePersistedState";

export interface MortgageSummary {
  hydrated: boolean;
  /** The scenario the mortgage tool itself has selected. */
  scenarioName: string;
  baseline: Amortization | null;
  current: Amortization | null;
  comparison: Comparison | null;
  error: string | null;
}

/**
 * Read-only mortgage figures for the dashboard.
 *
 * Deliberately not `useMortgageModel`. That hook owns a dozen mutators and runs
 * `useClockDefaults`, which *writes* to this same key — so mounting it here
 * would move the user's data as a side effect of glancing at a widget, and race
 * the tool if both were open. This reads and derives, nothing more.
 */
export function useMortgageSummary(): MortgageSummary {
  const { value: state, hydrated } = usePersistedState<AppState>(
    STORAGE_KEY,
    createDefaultState,
    { readOnly: true },
  );

  return useMemo(() => {
    const scenario =
      state.scenarios.find((candidate) => candidate.id === state.activeId) ?? state.scenarios[0];

    const baselineResult = simulate(state.loan, BASELINE_SCENARIO);
    const currentResult = scenario
      ? simulate(state.loan, scenario)
      : ({ ok: false, reason: "No scenario selected." } as const);

    const baseline = baselineResult.ok ? baselineResult : null;
    const current = currentResult.ok ? currentResult : null;

    return {
      hydrated,
      scenarioName: scenario?.name ?? "",
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
