"use client";

import { useCallback, useMemo } from "react";
import { BASELINE_SCENARIO, compare, simulate } from "@/lib/amortization";
import {
  SEED_MONTH,
  STORAGE_KEY,
  createDefaultState,
  createOneTime,
  createPmi,
  createScenario,
} from "@/lib/defaults";
import { currentMonthValue } from "@/lib/dates";
import { useClockDefaults } from "./useClockDefaults";
import type {
  Amortization,
  AppState,
  Comparison,
  Loan,
  Pmi,
  Scenario,
} from "@/lib/types";
import { usePersistedState } from "./usePersistedState";

export interface MortgageModel {
  hydrated: boolean;
  loan: Loan;
  scenarios: Scenario[];
  activeScenario: Scenario;
  activeId: string;
  /** Null while the loan inputs don't describe a loan that can be paid off. */
  baseline: Amortization | null;
  current: Amortization | null;
  comparison: Comparison | null;
  error: string | null;
  setLoanField: <K extends keyof Loan>(field: K, value: Loan[K]) => void;
  /** PMI settings, always present here even when the stored loan predates them. */
  pmi: Pmi;
  setPmiField: <K extends keyof Pmi>(field: K, value: Pmi[K]) => void;
  selectScenario: (id: string) => void;
  stepScenario: (direction: 1 | -1) => void;
  updateScenario: (id: string, patch: Partial<Scenario>) => void;
  addScenario: () => void;
  removeScenario: (id: string) => void;
  addOneTime: (scenarioId: string) => void;
  updateOneTime: (scenarioId: string, oneTimeId: string, patch: { amount?: number; month?: string }) => void;
  removeOneTime: (scenarioId: string, oneTimeId: string) => void;
  resetAll: () => void;
}

/**
 * Owns all mortgage state and derives every projection from it. Components
 * stay presentational and read whatever they need off the returned model.
 */
export function useMortgageModel(): MortgageModel {
  const { value: state, setValue, reset, hydrated } = usePersistedState<AppState>(
    STORAGE_KEY,
    createDefaultState,
  );

  // A loan still starting on `SEED_MONTH` is untouched seed data, so it can move
  // onto today's month once the clock is safe to read.
  const onSeedMonth = useCallback((prev: AppState) => prev.loan.start === SEED_MONTH, []);

  const applyClock = useCallback(
    (prev: AppState) => ({ ...prev, loan: { ...prev.loan, start: currentMonthValue() } }),
    [],
  );

  useClockDefaults(hydrated, setValue, onSeedMonth, applyClock);

  const activeScenario =
    state.scenarios.find((scenario) => scenario.id === state.activeId) ?? state.scenarios[0];

  const baselineResult = useMemo(() => simulate(state.loan, BASELINE_SCENARIO), [state.loan]);
  const currentResult = useMemo(
    () => simulate(state.loan, activeScenario),
    [state.loan, activeScenario],
  );

  const baseline = baselineResult.ok ? baselineResult : null;
  const current = currentResult.ok ? currentResult : null;
  const error = baselineResult.ok
    ? currentResult.ok
      ? null
      : currentResult.reason
    : baselineResult.reason;

  const comparison = useMemo(
    () => (baseline && current ? compare(baseline, current) : null),
    [baseline, current],
  );

  const setLoanField = useCallback<MortgageModel["setLoanField"]>(
    (field, value) => setValue((prev) => ({ ...prev, loan: { ...prev.loan, [field]: value } })),
    [setValue],
  );

  // A loan saved before PMI existed has no `pmi` at all, so every read goes
  // through the defaults rather than assuming the field is there.
  const pmi = useMemo(() => state.loan.pmi ?? createPmi(), [state.loan.pmi]);

  const setPmiField = useCallback<MortgageModel["setPmiField"]>(
    (field, value) =>
      setValue((prev) => ({
        ...prev,
        loan: { ...prev.loan, pmi: { ...(prev.loan.pmi ?? createPmi()), [field]: value } },
      })),
    [setValue],
  );

  const selectScenario = useCallback(
    (id: string) => setValue((prev) => ({ ...prev, activeId: id })),
    [setValue],
  );

  const stepScenario = useCallback(
    (direction: 1 | -1) =>
      setValue((prev) => {
        const index = prev.scenarios.findIndex((scenario) => scenario.id === prev.activeId);
        const count = prev.scenarios.length;
        const nextIndex = (index + direction + count) % count;
        return { ...prev, activeId: prev.scenarios[nextIndex].id };
      }),
    [setValue],
  );

  const updateScenario = useCallback<MortgageModel["updateScenario"]>(
    (id, patch) =>
      setValue((prev) => ({
        ...prev,
        activeId: id,
        scenarios: prev.scenarios.map((scenario) =>
          scenario.id === id ? { ...scenario, ...patch } : scenario,
        ),
      })),
    [setValue],
  );

  const addScenario = useCallback(() => {
    const scenario = createScenario();
    setValue((prev) => ({
      ...prev,
      scenarios: [...prev.scenarios, scenario],
      activeId: scenario.id,
    }));
  }, [setValue]);

  const removeScenario = useCallback(
    (id: string) =>
      setValue((prev) => {
        if (prev.scenarios.length <= 1) return prev;
        const scenarios = prev.scenarios.filter((scenario) => scenario.id !== id);
        return {
          ...prev,
          scenarios,
          activeId: prev.activeId === id ? scenarios[0].id : prev.activeId,
        };
      }),
    [setValue],
  );

  const addOneTime = useCallback(
    (scenarioId: string) =>
      setValue((prev) => ({
        ...prev,
        activeId: scenarioId,
        scenarios: prev.scenarios.map((scenario) =>
          scenario.id === scenarioId
            ? { ...scenario, oneTimes: [...scenario.oneTimes, createOneTime()] }
            : scenario,
        ),
      })),
    [setValue],
  );

  const updateOneTime = useCallback<MortgageModel["updateOneTime"]>(
    (scenarioId, oneTimeId, patch) =>
      setValue((prev) => ({
        ...prev,
        activeId: scenarioId,
        scenarios: prev.scenarios.map((scenario) =>
          scenario.id === scenarioId
            ? {
                ...scenario,
                oneTimes: scenario.oneTimes.map((payment) =>
                  payment.id === oneTimeId ? { ...payment, ...patch } : payment,
                ),
              }
            : scenario,
        ),
      })),
    [setValue],
  );

  const removeOneTime = useCallback(
    (scenarioId: string, oneTimeId: string) =>
      setValue((prev) => ({
        ...prev,
        activeId: scenarioId,
        scenarios: prev.scenarios.map((scenario) =>
          scenario.id === scenarioId
            ? {
                ...scenario,
                oneTimes: scenario.oneTimes.filter((payment) => payment.id !== oneTimeId),
              }
            : scenario,
        ),
      })),
    [setValue],
  );

  return {
    hydrated,
    loan: state.loan,
    scenarios: state.scenarios,
    activeScenario,
    activeId: state.activeId,
    baseline,
    current,
    comparison,
    error,
    setLoanField,
    pmi,
    setPmiField,
    selectScenario,
    stepScenario,
    updateScenario,
    addScenario,
    removeScenario,
    addOneTime,
    updateOneTime,
    removeOneTime,
    resetAll: reset,
  };
}
