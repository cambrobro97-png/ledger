"use client";

import type { RetirementModel } from "@/hooks/useRetirementModel";
import { Panel, PanelHead } from "../ui/Panel";
import { Button } from "../ui/Button";
import { OutlookCard } from "./OutlookCard";

/** The saved-outlook workbench, hidden while presenting. */
export function OutlookEditor({ model }: { model: RetirementModel }) {
  return (
    <Panel className="mt-3.5">
      <PanelHead
        title="Saved outlooks"
        hint="Edits are saved automatically and stay put between visits"
      />

      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3.5">
        {model.scenarios.map((scenario) => (
          <OutlookCard
            key={scenario.id}
            scenario={scenario}
            active={scenario.id === model.activeId}
            canDelete={model.scenarios.length > 1}
            spend={model.spendByScenario.get(scenario.id) ?? model.activeSpend}
            expensesReady={model.expensesReady}
            onSelect={() => model.selectScenario(scenario.id)}
            onChange={(patch) => model.updateScenario(scenario.id, patch)}
            onLinkSpend={(link) => model.linkSpend(scenario.id, link)}
            onDelete={() => model.removeScenario(scenario.id)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button onClick={model.addScenario}>Add an outlook</Button>
        <Button variant="ghost" onClick={model.resetAll}>
          Start over from the defaults
        </Button>
      </div>
    </Panel>
  );
}
