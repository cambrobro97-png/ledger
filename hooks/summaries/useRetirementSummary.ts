"use client";

import { useMemo } from "react";
import { BASELINE_SCENARIO, compare, project } from "@/lib/retirement";
import { RETIREMENT_STORAGE_KEY, createDefaultRetirementState } from "@/lib/defaults";
import { resolveRetirementMortgage, resolveRetirementSpend, resolveSalary } from "@/lib/links";
import type {
  Projection,
  RetirementComparison,
  RetirementProfile,
  RetirementState,
} from "@/lib/types";
import { useExpenseSummary } from "./useExpenseSummary";
import { useIncomeSummary } from "./useIncomeSummary";
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
  /** The profile every figure is derived from, links already resolved. */
  profile: RetirementProfile;
  /** What a year of retirement costs in today's dollars, from the list when linked. */
  annualSpend: number;
  /** How many outlooks take their spending from the expense list. */
  scenariosWithSpendLink: number;
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

  const expenses = useExpenseSummary();
  const expenseSource = useMemo(
    () => (expenses.hydrated ? { items: expenses.items } : null),
    [expenses.hydrated, expenses.items],
  );

  const income = useIncomeSummary();
  const incomeSource = useMemo(
    () => (income.hydrated ? { items: income.items } : null),
    [income.hydrated, income.items],
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
      spendLink: scenario.spendLink,
      withdrawal: scenario.withdrawal,
    };

    const linked = resolveRetirementMortgage(state.profile, mortgage);
    const salary = resolveSalary(state.profile, incomeSource);

    const profile: RetirementProfile = { ...state.profile };
    if (state.profile.mortgageLink) {
      profile.mortgagePayment = linked.payment;
      profile.mortgagePayoff = linked.payoff;
    }
    if (state.profile.salaryLink) profile.salary = salary.salary;

    // The outlook's spending, from the expense list when it is linked there.
    const spend = resolveRetirementSpend(profile, scenario, expenseSource);
    const spendingBase = spend.base ?? undefined;

    const baselineResult = project(profile, baselineScenario, spendingBase);
    const currentResult = project(profile, scenario, spendingBase);

    const baseline = baselineResult.ok ? baselineResult : null;
    const current = currentResult.ok ? currentResult : null;

    return {
      hydrated,
      outlookName: scenario?.name ?? "",
      currentAge: state.profile.currentAge,
      endAge: state.profile.endAge,
      profile,
      annualSpend: spend.annual,
      scenariosWithSpendLink: state.scenarios.filter((candidate) => candidate.spendLink).length,
      baseline,
      current,
      comparison: baseline && current ? compare(baseline, current) : null,
      error: baselineResult.ok
        ? currentResult.ok
          ? null
          : currentResult.reason
        : baselineResult.reason,
    };
  }, [state, hydrated, mortgage, expenseSource, incomeSource]);
}
