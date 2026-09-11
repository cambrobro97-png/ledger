"use client";

import { useCallback, useMemo } from "react";
import { BASELINE_SCENARIO, compare, project } from "@/lib/retirement";
import {
  RETIREMENT_STORAGE_KEY,
  SEED_MONTH,
  createAccount,
  createDefaultRetirementState,
  createRedirect,
  createRetirementScenario,
} from "@/lib/defaults";
import {
  addMonths,
  currentMonthValue,
  formatMonthValue,
  monthsBetween,
  parseMonth,
} from "@/lib/dates";
import {
  type LinkResolution,
  type MortgageSource,
  type IncomeSource,
  type RetirementSpend,
  resolveRetirementMortgage,
  resolveRetirementSpend,
  resolveSalary,
} from "@/lib/links";
import { useClockDefaults } from "./useClockDefaults";
import type {
  Account,
  MortgageRedirect,
  Projection,
  SpendLink,
  RetirementComparison,
  RetirementProfile,
  RetirementScenario,
  RetirementState,
} from "@/lib/types";
import { useExpenseSummary } from "./summaries/useExpenseSummary";
import { useIncomeSummary } from "./summaries/useIncomeSummary";
import { useMortgageSummary } from "./summaries/useMortgageSummary";
import { usePersistedState } from "./usePersistedState";

export interface RetirementModel {
  hydrated: boolean;
  /**
   * The profile every figure on screen is derived from: the stored one, with
   * the mortgage filled in from the scenario when it is linked.
   */
  profile: RetirementProfile;
  /** How the mortgage link is faring, or null when the figures were typed in. */
  mortgageResolution: LinkResolution | null;
  /** How the salary link is faring, or null when the salary was typed in. */
  salaryResolution: LinkResolution | null;
  /** The income tool's sources, or null until its stored state has been read. */
  income: IncomeSource | null;
  /** The mortgage tool's figures, or null until its stored state has been read. */
  mortgage: MortgageSource | null;
  /**
   * Each outlook's spending worked out against the expense list, keyed by id.
   * Every outlook is resolved, not just the active one, so each card can show
   * what its own link produces.
   */
  spendByScenario: Map<string, RetirementSpend>;
  /** The active outlook's spending, for the figures the page shows once. */
  activeSpend: RetirementSpend;
  /** Whether the expense tool's stored state has been read yet. */
  expensesReady: boolean;
  /**
   * The same outlook with the redirect switched off, for saying what the
   * redirect is worth. Null unless it is switched on — it costs a third full
   * projection, and there is nothing to compare against when it is off.
   */
  withoutRedirect: Projection | null;
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
  /** Points the mortgage figures at a scenario, or back at the fields. */
  linkMortgage: (scenarioId: string | null) => void;
  /** Points the salary at an income source, at all of them, or back at the field. */
  linkSalary: (itemId: string | null) => void;
  /** Points an outlook's spending at the expense list, or back at the field. */
  linkSpend: (scenarioId: string, link: SpendLink | null) => void;
  setRedirectField: <K extends keyof MortgageRedirect>(
    field: K,
    value: MortgageRedirect[K],
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
        mortgagePayoff: formatMonthValue(payoff),
      },
    };
  }, []);

  useClockDefaults(hydrated, setValue, onSeedMonth, applyClock);

  const mortgageSummary = useMortgageSummary();
  // Null until the mortgage tool's own stored state has landed. See the same
  // guard in `useExpenseModel`.
  const mortgage = mortgageSummary.hydrated ? mortgageSummary : null;

  const incomeSummary = useIncomeSummary();
  const income = useMemo(
    () => (incomeSummary.hydrated ? { items: incomeSummary.items } : null),
    [incomeSummary.hydrated, incomeSummary.items],
  );

  const linked = useMemo(
    () => resolveRetirementMortgage(state.profile, mortgage),
    [state.profile, mortgage],
  );

  const salary = useMemo(() => resolveSalary(state.profile, income), [state.profile, income]);

  // Everything downstream runs on this rather than the stored profile, so a
  // linked mortgage reaches the projection, the charts and the panel as one
  // set of figures. Unlinked, it is the stored profile unchanged.
  const profile = useMemo<RetirementProfile>(() => {
    const next = { ...state.profile };
    if (state.profile.mortgageLink) {
      next.mortgagePayment = linked.payment;
      next.mortgagePayoff = linked.payoff;
    }
    if (state.profile.salaryLink) next.salary = salary.salary;
    return next;
  }, [state.profile, linked, salary]);

  const expenses = useExpenseSummary();
  // Same guard as the mortgage: nothing resolves until the tool it reads has
  // actually been read. Memoised, or every render would hand the resolution
  // below a new object and rebuild every outlook's spending for nothing.
  const expenseSource = useMemo(
    () => (expenses.hydrated ? { items: expenses.items } : null),
    [expenses.hydrated, expenses.items],
  );

  const activeScenario =
    state.scenarios.find((scenario) => scenario.id === state.activeId) ?? state.scenarios[0];

  const spendByScenario = useMemo(() => {
    const resolved = new Map<string, RetirementSpend>();
    for (const scenario of state.scenarios) {
      resolved.set(scenario.id, resolveRetirementSpend(profile, scenario, expenseSource));
    }
    return resolved;
  }, [profile, state.scenarios, expenseSource]);

  const activeSpend =
    spendByScenario.get(activeScenario.id) ??
    resolveRetirementSpend(profile, activeScenario, expenseSource);
  const spendingBase = activeSpend.base ?? undefined;

  // The baseline keeps the active outlook's spending and inflation, so the
  // comparison isolates what the market shift alone is worth.
  const baselineScenario = useMemo(
    () => ({
      ...BASELINE_SCENARIO,
      inflation: activeScenario.inflation,
      colaIncrease: activeScenario.colaIncrease,
      annualSpend: activeScenario.annualSpend,
      spendLink: activeScenario.spendLink,
      withdrawal: activeScenario.withdrawal,
    }),
    [activeScenario],
  );

  const baselineResult = useMemo(
    () => project(profile, baselineScenario, spendingBase),
    [profile, baselineScenario, spendingBase],
  );
  const currentResult = useMemo(
    () => project(profile, activeScenario, spendingBase),
    [profile, activeScenario, spendingBase],
  );

  /*
   * The same outlook with the redirect off, which is the only way to say what
   * the redirect is worth. It is a third full projection, so it is computed
   * only while the redirect is actually switched on.
   */
  const withoutRedirect = useMemo(() => {
    if (!profile.redirect?.enabled) return null;
    const result = project({ ...profile, redirect: undefined }, activeScenario, spendingBase);
    return result.ok ? result : null;
  }, [profile, activeScenario, spendingBase]);

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

  const linkMortgage = useCallback<RetirementModel["linkMortgage"]>(
    (scenarioId) =>
      setValue((prev) => {
        if (scenarioId === null) {
          // Unlinking keeps whatever is on screen, so nothing visibly moves —
          // only where the next figure comes from.
          const profile = { ...prev.profile };
          delete profile.mortgageLink;
          return { ...prev, profile };
        }
        return {
          ...prev,
          profile: { ...prev.profile, mortgageLink: { source: "mortgage", scenarioId } },
        };
      }),
    [setValue],
  );

  const linkSpend = useCallback<RetirementModel["linkSpend"]>(
    (scenarioId, link) =>
      setValue((prev) => ({
        ...prev,
        activeId: scenarioId,
        scenarios: prev.scenarios.map((scenario) => {
          if (scenario.id !== scenarioId) return scenario;
          if (link) return { ...scenario, spendLink: link };
          // Unlinking keeps whatever the field was last showing, so nothing
          // visibly moves — only where the next figure comes from.
          const next = { ...scenario };
          delete next.spendLink;
          return next;
        }),
      })),
    [setValue],
  );

  const linkSalary = useCallback<RetirementModel["linkSalary"]>(
    (itemId) =>
      setValue((prev) => {
        const profile = { ...prev.profile };
        if (itemId === null) delete profile.salaryLink;
        else profile.salaryLink = { source: "income", itemId };
        return { ...prev, profile };
      }),
    [setValue],
  );

  const setRedirectField = useCallback<RetirementModel["setRedirectField"]>(
    (field, value) =>
      setValue((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          redirect: { ...(prev.profile.redirect ?? createRedirect()), [field]: value },
        },
      })),
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
    profile,
    mortgageResolution: linked.resolution,
    salaryResolution: salary.resolution,
    mortgage,
    income,
    spendByScenario,
    activeSpend,
    expensesReady: expenses.hydrated,
    withoutRedirect,
    scenarios: state.scenarios,
    activeScenario,
    activeId: state.activeId,
    baseline,
    current,
    comparison,
    error,
    setProfileField,
    linkMortgage,
    linkSalary,
    linkSpend,
    setRedirectField,
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
