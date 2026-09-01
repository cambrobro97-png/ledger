"use client";

import { useCallback, useMemo } from "react";
import {
  INCOME_STORAGE_KEY,
  SEED_YEAR,
  createIncomeItem,
  createDefaultIncomeState,
} from "@/lib/defaults";
import { buildYear } from "@/lib/income";
import type { IncomeItem, IncomeState, IncomeYear } from "@/lib/types";
import { usePersistedState } from "./usePersistedState";
import { useClockDefaults } from "./useClockDefaults";

export interface IncomeModel {
  hydrated: boolean;
  year: number;
  items: IncomeItem[];
  /** Everything drawn on screen, derived in one pass from the items. */
  derived: IncomeYear;
  setYear: (year: number) => void;
  stepYear: (direction: 1 | -1) => void;
  addItem: () => void;
  updateItem: (id: string, patch: Partial<IncomeItem>) => void;
  removeItem: (id: string) => void;
  resetAll: () => void;
}

/**
 * Owns the income list and derives the year's timeline from it. Components
 * stay presentational and read whatever they need off the returned model.
 */
export function useIncomeModel(): IncomeModel {
  const { value: state, setValue, reset, hydrated } = usePersistedState<IncomeState>(
    INCOME_STORAGE_KEY,
    createDefaultIncomeState,
  );

  // A list still sitting on the seed year is untouched seed data, so it can move
  // onto the real year once the clock is safe to read.
  const onSeedYear = useCallback((prev: IncomeState) => prev.year === SEED_YEAR, []);

  const applyClock = useCallback((prev: IncomeState) => {
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

  const derived = useMemo(() => buildYear(state.items, state.year), [state.items, state.year]);

  const setYear = useCallback(
    (year: number) => setValue((prev) => ({ ...prev, year })),
    [setValue],
  );

  const stepYear = useCallback(
    (direction: 1 | -1) => setValue((prev) => ({ ...prev, year: prev.year + direction })),
    [setValue],
  );

  const addItem = useCallback(
    () =>
      setValue((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          // New rows cycle through the accents so a fresh source is legible
          // against the ones already on the timeline.
          createIncomeItem(prev.year, { accent: prev.items.length }),
        ],
      })),
    [setValue],
  );

  const updateItem = useCallback<IncomeModel["updateItem"]>(
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
