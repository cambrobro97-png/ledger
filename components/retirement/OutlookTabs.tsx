"use client";

import { isBaselineOutlook } from "@/lib/describeRetirement";
import type { RetirementScenario } from "@/lib/types";
import { Tabs } from "../ui/Tabs";

interface OutlookTabsProps {
  scenarios: RetirementScenario[];
  activeId: string;
  presenting: boolean;
  onSelect: (id: string) => void;
}

/** The outlook switcher. Selecting one swaps the projection, not the page. */
export function OutlookTabs({ scenarios, activeId, presenting, onSelect }: OutlookTabsProps) {
  return (
    <Tabs
      tabs={scenarios.map((scenario) => ({
        id: scenario.id,
        name: scenario.name,
        muted: isBaselineOutlook(scenario),
      }))}
      activeId={activeId}
      presenting={presenting}
      label="Outlooks"
      onSelect={onSelect}
    />
  );
}
