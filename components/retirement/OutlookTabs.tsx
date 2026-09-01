"use client";

import { isBaselineOutlook } from "@/lib/describeRetirement";
import type { RetirementScenario } from "@/lib/types";
import styles from "../ScenarioTabs.module.css";

interface OutlookTabsProps {
  scenarios: RetirementScenario[];
  activeId: string;
  presenting: boolean;
  onSelect: (id: string) => void;
}

/** The outlook switcher. Selecting one swaps the projection, not the page. */
export function OutlookTabs({ scenarios, activeId, presenting, onSelect }: OutlookTabsProps) {
  return (
    <nav className={styles.tabs} role="tablist" aria-label="Outlooks">
      {scenarios.map((scenario) => {
        const classes = [
          styles.tab,
          isBaselineOutlook(scenario) ? styles.baseline : "",
          presenting ? styles.presenting : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={scenario.id}
            type="button"
            role="tab"
            className={classes}
            aria-selected={scenario.id === activeId}
            onClick={() => onSelect(scenario.id)}
          >
            <i className={styles.dot} />
            {scenario.name}
          </button>
        );
      })}
    </nav>
  );
}
