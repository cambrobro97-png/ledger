"use client";

import type { RetirementModel } from "@/hooks/useRetirementModel";
import { Panel, PanelHead } from "../ui/Panel";
import { Button } from "../ui/Button";
import { OutlookCard } from "./OutlookCard";
import styles from "./Editor.module.css";

/** The saved-outlook workbench, hidden while presenting. */
export function OutlookEditor({ model }: { model: RetirementModel }) {
  return (
    <Panel className={styles.editor}>
      <PanelHead
        title="Saved outlooks"
        hint="Edits are saved automatically and stay put between visits"
      />

      <div className={styles.grid}>
        {model.scenarios.map((scenario) => (
          <OutlookCard
            key={scenario.id}
            scenario={scenario}
            active={scenario.id === model.activeId}
            canDelete={model.scenarios.length > 1}
            onSelect={() => model.selectScenario(scenario.id)}
            onChange={(patch) => model.updateScenario(scenario.id, patch)}
            onDelete={() => model.removeScenario(scenario.id)}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <Button onClick={model.addScenario}>Add an outlook</Button>
        <Button variant="ghost" onClick={model.resetAll}>
          Start over from the defaults
        </Button>
      </div>
    </Panel>
  );
}
