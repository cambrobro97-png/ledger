"use client";

import type { MortgageModel } from "@/hooks/useMortgageModel";
import { Panel, PanelHead } from "./ui/Panel";
import { Button } from "./ui/Button";
import { ScenarioCard } from "./ScenarioCard";
import styles from "./ScenarioEditor.module.css";

/** The saved-scenario workbench, hidden while presenting. */
export function ScenarioEditor({ model }: { model: MortgageModel }) {
  return (
    <Panel className={styles.editor}>
      <PanelHead
        title="Saved scenarios"
        hint="Edits are saved automatically and stay put between visits"
      />

      <div className={styles.grid}>
        {model.scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            active={scenario.id === model.activeId}
            canDelete={model.scenarios.length > 1}
            onSelect={() => model.selectScenario(scenario.id)}
            onChange={(patch) => model.updateScenario(scenario.id, patch)}
            onAddOneTime={() => model.addOneTime(scenario.id)}
            onChangeOneTime={(oneTimeId, patch) =>
              model.updateOneTime(scenario.id, oneTimeId, patch)
            }
            onRemoveOneTime={(oneTimeId) => model.removeOneTime(scenario.id, oneTimeId)}
            onDelete={() => model.removeScenario(scenario.id)}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <Button onClick={model.addScenario}>Add a scenario</Button>
        <Button variant="ghost" onClick={model.resetAll}>
          Start over from the defaults
        </Button>
      </div>
    </Panel>
  );
}
