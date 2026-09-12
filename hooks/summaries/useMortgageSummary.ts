"use client";

import { useMemo } from "react";
import { BASELINE_SCENARIO, compare, simulate, simulateAll } from "@/lib/amortization";
import { STORAGE_KEY, createDefaultState } from "@/lib/defaults";
import type {
  Amortization,
  AmortizationResult,
  Comparison,
  AppState,
  Loan,
  Scenario,
} from "@/lib/types";
import { usePersistedState } from "../usePersistedState";

export interface MortgageSummary {
  hydrated: boolean;
  /** The loan every scenario is run against. */
  loan: Loan;
  /** Every saved scenario, in the order the mortgage tool lists them. */
  scenarios: Scenario[];
  /** Id of the scenario the mortgage tool has selected. */
  activeId: string;
  /** Name of that scenario, which is what a card labels its figures with. */
  scenarioName: string;
  /**
   * Each scenario's run, keyed by id — including the ones that failed, so a
   * caller can say why rather than only that it has nothing to show.
   */
  runs: Map<string, AmortizationResult>;
  baseline: Amortization | null;
  current: Amortization | null;
  comparison: Comparison | null;
  error: string | null;
}

/**
 * Read-only mortgage figures, for the dashboard cards and for the tools that
 * link to a scenario.
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
    const runs = simulateAll(state.loan, state.scenarios);
    // Read back out of `runs` rather than simulated again: the figures a card
    // shows and the figures a link resolves against have to be the same run.
    const currentResult =
      runs.get(scenario?.id ?? "") ?? ({ ok: false, reason: "No scenario selected." } as const);

    const baseline = baselineResult.ok ? baselineResult : null;
    const current = currentResult.ok ? currentResult : null;

    return {
      hydrated,
      loan: state.loan,
      scenarios: state.scenarios,
      activeId: state.activeId,
      scenarioName: scenario?.name ?? "",
      runs,
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
