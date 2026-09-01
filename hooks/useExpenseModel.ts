"use client";

import { useCallback, useMemo } from "react";
import {
  EXPENSE_STORAGE_KEY,
  SEED_YEAR,
  createDefaultExpenseState,
  createExpenseItem,
} from "@/lib/defaults";
import { buildExpenseYear } from "@/lib/expenses";
import type { ExpenseItem, ExpenseState, ExpenseYear } from "@/lib/types";
import { usePersistedState } from "./usePersistedState";
import { useClockDefaults } from "./useClockDefaults";

export interface ExpenseModel {
  hydrated: boolean;
  year: number;
  items: ExpenseItem[];
  /** Everything drawn on screen, derived in one pass from the items. */
  derived: ExpenseYear;
  setYear: (year: number) => void;
  stepYear: (direction: 1 | -1) => void;
  /** Adds a line. `once` starts a one-off, anything else a repeating bill. */
  addItem: (overrides?: Partial<ExpenseItem>) => void;
  updateItem: (id: string, patch: Partial<ExpenseItem>) => void;
  removeItem: (id: string) => void;
  resetAll: () => void;
}

/**
 * Owns the expense list and derives the year's timeline from it. Components
 * stay presentational and read whatever they need off the returned model.
 */
export function useExpenseModel(): ExpenseModel {
  const { value: state, setValue, reset, hydrated } = usePersistedState<ExpenseState>(
    EXPENSE_STORAGE_KEY,
    createDefaultExpenseState,
  );

  // A list still sitting on the seed year is untouched seed data, so it can move
  // onto the real year once the clock is safe to read.
  const onSeedYear = useCallback((prev: ExpenseState) => prev.year === SEED_YEAR, []);

  const applyClock = useCallback((prev: ExpenseState) => {
    const year = new Date().getFullYear();
    if (year === prev.year) return prev;

    // The anchors carry the seed year in their `YYYY-MM-DD`, so they shift with
    // it — otherwise the timeline would open on a year whose payments all sit
    // before the items' first payment, and draw nothing.
    return {
      year,
      items: prev.items.map((item) => ({
        ...item,
        anchor: item.anchor.replace(/^\d{4}/, String(year)),
      })),
    };
  }, []);

  useClockDefaults(hydrated, setValue, onSeedYear, applyClock);

  const derived = useMemo(
    () => buildExpenseYear(state.items, state.year),
    [state.items, state.year],
  );

  const setYear = useCallback(
    (year: number) => setValue((prev) => ({ ...prev, year })),
    [setValue],
  );

  const stepYear = useCallback(
    (direction: 1 | -1) => setValue((prev) => ({ ...prev, year: prev.year + direction })),
    [setValue],
  );

  const addItem = useCallback<ExpenseModel["addItem"]>(
    (overrides) =>
      setValue((prev) => ({
        ...prev,
        items: [...prev.items, createExpenseItem(prev.year, overrides)],
      })),
    [setValue],
  );

  const updateItem = useCallback<ExpenseModel["updateItem"]>(
    (id, patch) =>
      setValue((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      })),
    [setValue],
  );

  const removeItem = useCallback(
    (id: string) =>
      setValue((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) })),
    [setValue],
  );

  return {
    hydrated,
    year: state.year,
    items: state.items,
    derived,
    setYear,
    stepYear,
    addItem,
    updateItem,
    removeItem,
    resetAll: reset,
  };
}
