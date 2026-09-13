"use client";

import type { RetirementModel } from "@/hooks/useRetirementModel";
import { Panel, PanelHead } from "../ui/Panel";
import { Button } from "../ui/Button";
import { AccountCard } from "./AccountCard";

/** The account workbench, hidden while presenting. */
export function AccountEditor({ model }: { model: RetirementModel }) {
  return (
    <Panel className="mt-3.5">
      <PanelHead
        title="Your accounts"
        hint="Shared by every outlook — the market is what changes between them"
      />

      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3.5">
        {model.profile.accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            currentAge={model.profile.currentAge}
            canDelete={model.profile.accounts.length > 1}
            onChange={(patch) => model.updateAccount(account.id, patch)}
            onDelete={() => model.removeAccount(account.id)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button onClick={model.addAccount}>Add an account</Button>
      </div>
    </Panel>
  );
}
