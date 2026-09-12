"use client";

import { RETIREMENT_STORAGE_KEY, createDefaultRetirementState } from "@/lib/defaults";
import type { Account, RetirementState } from "@/lib/types";
import { usePersistedState } from "../usePersistedState";

export interface RetirementAccountsSummary {
  hydrated: boolean;
  accounts: Account[];
}

/**
 * The retirement accounts, read and nothing more.
 *
 * Deliberately not `useRetirementSummary`. That hook projects, and to project it
 * reads the expense list — so an expense line driven by the retirement tool
 * cannot go through it without the two hooks mounting each other forever.
 *
 * This reads the stored accounts and stops, which is all a contributions line
 * needs and is what keeps the graph acyclic. Anything here that grows a taste
 * for projections belongs in the other hook instead.
 */
export function useRetirementAccounts(): RetirementAccountsSummary {
  const { value: state, hydrated } = usePersistedState<RetirementState>(
    RETIREMENT_STORAGE_KEY,
    createDefaultRetirementState,
    { readOnly: true },
  );

  return { hydrated, accounts: state.profile.accounts };
}
