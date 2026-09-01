"use client";

import { useCallback, useMemo } from "react";
import { BASELINE_SCENARIO, compare, project } from "@/lib/retirement";
import {
  RETIREMENT_STORAGE_KEY,
  SEED_MONTH,
  createAccount,
  createDefaultRetirementState,
  createRetirementScenario,
} from "@/lib/defaults";
import { addMonths, currentMonthValue, monthsBetween, parseMonth } from "@/lib/dates";
import { useClockDefaults } from "./useClockDefaults";
import type {
  Account,
  Projection,
  RetirementComparison,
  RetirementProfile,
  RetirementScenario,
  RetirementState,
} from "@/lib/types";
import { usePersistedState } from "./usePersistedState";

export interface RetirementModel {
  hydrated: boolean;
  profile: RetirementProfile;
  scenarios: RetirementScenario[];
  activeScenario: RetirementScenario;
  activeId: string;
  /** Null while the inputs don't describe a portfolio that can be projected. */
  baseline: Projection | null;
  current: Projection | null;
  comparison: RetirementComparison | null;
  error: string | null;
  setProfileField: <K extends keyof RetirementProfile>(
    field: K,
    value: RetirementProfile[K],
  ) => void;
  addAccount: () => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  selectScenario: (id: string) => void;
  stepScenario: (direction: 1 | -1) => void;
  updateScenario: (id: string, patch: Partial<RetirementScenario>) => void;
  addScenario: () => void;
  removeScenario: (id: string) => void;
  resetAll: () => void;
}

/**
 * Owns all retirement state and derives every projection from it. Components
 * stay presentational and read whatever they need off the returned model.
 */
export function useRetirementModel(): RetirementModel {
  const { value: state, setValue, reset, hydrated } = usePersistedState<RetirementState>(
    RETIREMENT_STORAGE_KEY,
    createDefaultRetirementState,
  );

  // Seed data still sitting on `SEED_MONTH` is nobody's edit, so it's safe to
  // move onto today's month. A stored profile has some other start and is left
  // alone.
  const onSeedMonth = useCallback(
    (prev: RetirementState) => prev.profile.start === SEED_MONTH,
    [],
  );

  const applyClock = useCallback((prev: RetirementState) => {
    const start = currentMonthValue();
    // The payoff moves with the start rather than being recomputed, so a profile
    // that was 15 years from its seed month is still 15 years out from today.
    const drift = monthsBetween(parseMonth(SEED_MONTH), parseMonth(start));
    const payoff = addMonths(parseMonth(prev.profile.mortgagePayoff), drift);

    return {
      ...prev,
      profile: {
        ...prev.profile,
        start,
        mortgagePayoff: `${payoff.year}-${String(payoff.month + 1).padStart(2, "0")}`,
      },
    };
  }, []);

  useClockDefaults(hydrated, setValue, onSeedMonth, applyClock);

  const activeScenario =
    state.scenarios.find((scenario) => scenario.id === state.activeId) ?? state.scenarios[0];

  // The baseline keeps the active outlook's spending and inflation, so the
  // comparison isolates what the market shift alone is worth.
  const baselineScenario = useMemo(
    () => ({
      ...BASELINE_SCENARIO,
      inflation: activeScenario.inflation,
      colaIncrease: activeScenario.colaIncrease,
      annualSpend: activeScenario.annualSpend,
      withdrawal: activeScenario.withdrawal,
    }),
    [activeScenario],
  );

  const baselineResult = useMemo(
    () => project(state.profile, baselineScenario),
    [state.profile, baselineScenario],
  );
  const currentResult = useMemo(
    () => project(state.profile, activeScenario),
    [state.profile, activeScenario],
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

  const setProfileField = useCallback<RetirementModel["setProfileField"]>(
    (field, value) =>
      setValue((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } })),
    [setValue],
  );

  const addAccount = useCallback(
    () =>
      setValue((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          // Keep colours walking forward, so a new account never repeats the last.
          accounts: [
            ...prev.profile.accounts,
            createAccount({ accent: prev.profile.accounts.length }),
          ],
        },
      })),
    [setValue],
  );

  const updateAccount = useCallback<RetirementModel["updateAccount"]>(
    (id, patch) =>
      setValue((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          accounts: prev.profile.accounts.map((account) =>
            account.id === id ? { ...account, ...patch } : account,
          ),
        },
      })),
    [setValue],
  );

  const removeAccount = useCallback(
    (id: string) =>
      setValue((prev) => {
        if (prev.profile.accounts.length <= 1) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            accounts: prev.profile.accounts.filter((account) => account.id !== id),
          },
        };
      }),
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

  const updateScenario = useCallback<RetirementModel["updateScenario"]>(
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
    const scenario = createRetirementScenario();
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

  return {
    hydrated,
    profile: state.profile,
    scenarios: state.scenarios,
    activeScenario,
    activeId: state.activeId,
    baseline,
    current,
    comparison,
    error,
    setProfileField,
    addAccount,
    updateAccount,
    removeAccount,
    selectScenario,
    stepScenario,
    updateScenario,
    addScenario,
    removeScenario,
    resetAll: reset,
  };
}
