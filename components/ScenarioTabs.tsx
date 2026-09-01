"use client";

import { isBaselineLike } from "@/lib/describe";
import type { Scenario } from "@/lib/types";
import styles from "./ScenarioTabs.module.css";

interface ScenarioTabsProps {
  scenarios: Scenario[];
  activeId: string;
  presenting: boolean;
  onSelect: (id: string) => void;
}

/** The scenario switcher. Selecting one swaps the values, not the page. */
export function ScenarioTabs({ scenarios, activeId, presenting, onSelect }: ScenarioTabsProps) {
  return (
    <nav className={styles.tabs} role="tablist" aria-label="Scenarios">
      {scenarios.map((scenario) => {
        const classes = [
          styles.tab,
          isBaselineLike(scenario) ? styles.baseline : "",
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
