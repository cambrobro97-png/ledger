"use client";

import { useMemo } from "react";
import { EXPENSE_STORAGE_KEY, createDefaultExpenseState } from "@/lib/defaults";
import { buildExpenseYear } from "@/lib/expenses";
import { resolveExpenseItems } from "@/lib/links";
import type { ExpenseItem, ExpenseState, ExpenseYear } from "@/lib/types";
import { useMortgageSummary } from "./useMortgageSummary";
import { usePersistedState } from "../usePersistedState";

export interface ExpenseSummary {
  hydrated: boolean;
  /** The year the expense tool is sitting on. See `useIncomeSummary`. */
  year: number;
  /**
   * The lines themselves, for callers that need more than the year's totals —
   * what a bill costs in a full year of its own rhythm, and when it stops.
   * Linked lines arrive resolved, exactly as the expense tool shows them.
   */
  items: ExpenseItem[];
  derived: ExpenseYear;
}

/**
 * Read-only spending figures, for the dashboard cards and for the tools that
 * build on the expense list. See `useMortgageSummary`.
 *
 * Links are resolved here too, rather than only in the expense tool. A card
 * reading the raw list would show a mortgage line at whatever figure it was
 * linked at, and quietly disagree with the page it links to.
 */
export function useExpenseSummary(): ExpenseSummary {
  const { value: state, hydrated } = usePersistedState<ExpenseState>(
    EXPENSE_STORAGE_KEY,
    createDefaultExpenseState,
    { readOnly: true },
  );

  const mortgageSummary = useMortgageSummary();
  const mortgage = mortgageSummary.hydrated ? mortgageSummary : null;

  const items = useMemo(
    () => resolveExpenseItems(state.items, mortgage).items,
    [state.items, mortgage],
  );

  const derived = useMemo(() => buildExpenseYear(items, state.year), [items, state.year]);

  return { hydrated, year: state.year, items, derived };
}
