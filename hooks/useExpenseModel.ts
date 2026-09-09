"use client";

import { useCallback, useMemo } from "react";
import {
  EXPENSE_STORAGE_KEY,
  SEED_YEAR,
  createDefaultExpenseState,
  createExpenseItem,
} from "@/lib/defaults";
import { buildExpenseYear } from "@/lib/expenses";
import {
  type LinkResolution,
  type MortgageSource,
  mortgageLinkSeed,
  resolveExpenseItems,
} from "@/lib/links";
import type { ExpenseItem, ExpenseState, ExpenseYear, MortgagePart } from "@/lib/types";
import { useMortgageSummary } from "./summaries/useMortgageSummary";
import { usePersistedState } from "./usePersistedState";
import { useClockDefaults } from "./useClockDefaults";

export interface ExpenseModel {
  hydrated: boolean;
  year: number;
  /** The list as everything on screen sees it, with linked lines filled in. */
  items: ExpenseItem[];
  /** Everything drawn on screen, derived in one pass from the items. */
  derived: ExpenseYear;
  /** How each linked line is faring, keyed by item id. Empty for the rest. */
  resolutions: Map<string, LinkResolution>;
  /** The mortgage tool's figures, or null until its stored state has been read. */
  mortgage: MortgageSource | null;
  setYear: (year: number) => void;
  stepYear: (direction: 1 | -1) => void;
  /** Adds a line. `once` starts a one-off, anything else a repeating bill. */
  addItem: (overrides?: Partial<ExpenseItem>) => void;
  updateItem: (id: string, patch: Partial<ExpenseItem>) => void;
  removeItem: (id: string) => void;
  /** Puts one piece of a mortgage scenario on the list as a linked line. */
  addMortgageLink: (scenarioId: string, part: MortgagePart, oneTimeId?: string) => void;
  /** Keeps the figures, drops the link: the line becomes an ordinary expense. */
  unlinkItem: (id: string) => void;
  resetAll: () => void;
}

/**
 * Owns the expense list and derives the year's timeline from it. Components
 * stay presentational and read whatever they need off the returned model.
 *
 * The mortgage tool is read here too, but only read: `useMortgageSummary` never
 * writes, so linking a scenario onto the timeline can't disturb the tool it
 * came from.
 */
export function useExpenseModel(): ExpenseModel {
  const { value: state, setValue, reset, hydrated } = usePersistedState<ExpenseState>(
    EXPENSE_STORAGE_KEY,
    createDefaultExpenseState,
  );

  const mortgageSummary = useMortgageSummary();
  // Null until the mortgage tool's own stored state has landed. Resolving
  // against the seed loan in the meantime would show a payment nobody has,
  // then swap it a frame later.
  const mortgage = mortgageSummary.hydrated ? mortgageSummary : null;

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

  const { items, resolutions } = useMemo(
    () => resolveExpenseItems(state.items, mortgage),
    [state.items, mortgage],
  );

  const derived = useMemo(() => buildExpenseYear(items, state.year), [items, state.year]);

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

  const addMortgageLink = useCallback<ExpenseModel["addMortgageLink"]>(
    (scenarioId, part, oneTimeId) => {
      if (!mortgage) return;
      const seed = mortgageLinkSeed(mortgage, scenarioId, part, oneTimeId);
      setValue((prev) => ({
        ...prev,
        items: [...prev.items, createExpenseItem(prev.year, seed)],
      }));
    },
    [mortgage, setValue],
  );

  const unlinkItem = useCallback(
    (id: string) =>
      setValue((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== id || !item.link) return item;
          // The figures on screen are the resolved ones, so those are what the
          // line keeps — unlinking should change nothing you can see, only
          // where the numbers come from next time.
          const resolved = items.find((candidate) => candidate.id === id) ?? item;
          const frozen: ExpenseItem = { ...item, ...resolved };
          delete frozen.link;
          return frozen;
        }),
      })),
    [items, setValue],
  );

  return {
    hydrated,
    year: state.year,
    items,
    derived,
    resolutions,
    mortgage,
    setYear,
    stepYear,
    addItem,
    updateItem,
    removeItem,
    addMortgageLink,
    unlinkItem,
    resetAll: reset,
  };
}
