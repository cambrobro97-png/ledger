"use client";

import { useMemo } from "react";
import { EXPENSE_STORAGE_KEY, createDefaultExpenseState } from "@/lib/defaults";
import { buildExpenseYear } from "@/lib/expenses";
import type { ExpenseState, ExpenseYear } from "@/lib/types";
import { usePersistedState } from "../usePersistedState";

export interface ExpenseSummary {
  hydrated: boolean;
  /** The year the expense tool is sitting on. See `useIncomeSummary`. */
  year: number;
  derived: ExpenseYear;
}

/** Read-only spending figures for the dashboard. See `useMortgageSummary`. */
export function useExpenseSummary(): ExpenseSummary {
  const { value: state, hydrated } = usePersistedState<ExpenseState>(
    EXPENSE_STORAGE_KEY,
    createDefaultExpenseState,
    { readOnly: true },
  );

  const derived = useMemo(
    () => buildExpenseYear(state.items, state.year),
    [state.items, state.year],
  );

  return { hydrated, year: state.year, derived };
}
