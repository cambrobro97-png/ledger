"use client";

import type { MortgageModel } from "@/hooks/useMortgageModel";
import { Panel, PanelHead } from "./ui/Panel";
import { Button } from "./ui/Button";
import { ScenarioCard } from "./ScenarioCard";

/** The saved-scenario workbench, hidden while presenting. */
export function ScenarioEditor({ model }: { model: MortgageModel }) {
  return (
    <Panel className="mt-3.5">
      <PanelHead
        title="Saved scenarios"
        hint="Edits are saved automatically and stay put between visits"
      />

      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3.5">
        {model.scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            active={scenario.id === model.activeId}
            canDelete={model.scenarios.length > 1}
            spare={model.spare}
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

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button onClick={model.addScenario}>Add a scenario</Button>
        <Button variant="ghost" onClick={model.resetAll}>
          Start over from the defaults
        </Button>
      </div>
    </Panel>
  );
}
