"use client";

import { useMemo } from "react";
import { INCOME_STORAGE_KEY, createDefaultIncomeState } from "@/lib/defaults";
import { buildYear } from "@/lib/income";
import type { IncomeItem, IncomeState, IncomeYear } from "@/lib/types";
import { usePersistedState } from "../usePersistedState";

export interface IncomeSummary {
  hydrated: boolean;
  /**
   * The year the income tool is sitting on. The dashboard never runs
   * `useClockDefaults`, so untouched seed data still reads as the seed year —
   * which is why every widget shows this rather than assuming "now".
   */
  year: number;
  /**
   * The sources themselves, for callers that need more than the year's totals —
   * what a source pays in a full year of its own rhythm.
   */
  items: IncomeItem[];
  derived: IncomeYear;
}

/** Read-only income figures for the dashboard. See `useMortgageSummary`. */
export function useIncomeSummary(): IncomeSummary {
  const { value: state, hydrated } = usePersistedState<IncomeState>(
    INCOME_STORAGE_KEY,
    createDefaultIncomeState,
    { readOnly: true },
  );

  const derived = useMemo(() => buildYear(state.items, state.year), [state.items, state.year]);

  return { hydrated, year: state.year, items: state.items, derived };
}
