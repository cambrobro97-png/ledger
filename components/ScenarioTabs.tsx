"use client";

import { isBaselineLike } from "@/lib/describe";
import type { Scenario } from "@/lib/types";
import { Tabs } from "./ui/Tabs";

interface ScenarioTabsProps {
  scenarios: Scenario[];
  activeId: string;
  presenting: boolean;
  onSelect: (id: string) => void;
}

/** The scenario switcher. Selecting one swaps the values, not the page. */
export function ScenarioTabs({ scenarios, activeId, presenting, onSelect }: ScenarioTabsProps) {
  return (
    <Tabs
      tabs={scenarios.map((scenario) => ({
        id: scenario.id,
        name: scenario.name,
        muted: isBaselineLike(scenario),
      }))}
      activeId={activeId}
      presenting={presenting}
      label="Scenarios"
      onSelect={onSelect}
    />
  );
}
