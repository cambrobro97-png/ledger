"use client";

import { useMemo } from "react";
import { EXPENSE_STORAGE_KEY, createDefaultExpenseState } from "@/lib/defaults";
import { buildExpenseYear } from "@/lib/expenses";
import type { ExpenseItem, ExpenseState, ExpenseYear } from "@/lib/types";
import { usePersistedState } from "../usePersistedState";

export interface ExpenseSummary {
  hydrated: boolean;
  /** The year the expense tool is sitting on. See `useIncomeSummary`. */
  year: number;
  /**
   * The lines themselves, for callers that need more than the year's totals —
   * what a bill costs in a full year of its own rhythm, and when it stops.
   */
  items: ExpenseItem[];
  derived: ExpenseYear;
}

/**
 * Read-only spending figures, for the dashboard cards and for the tools that
 * build on the expense list. See `useMortgageSummary`.
 */
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

  return { hydrated, year: state.year, items: state.items, derived };
}
