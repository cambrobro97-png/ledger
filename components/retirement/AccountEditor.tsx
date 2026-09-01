"use client";

import type { RetirementModel } from "@/hooks/useRetirementModel";
import { Panel, PanelHead } from "../ui/Panel";
import { Button } from "../ui/Button";
import { AccountCard } from "./AccountCard";
import styles from "./Editor.module.css";

/** The account workbench, hidden while presenting. */
export function AccountEditor({ model }: { model: RetirementModel }) {
  return (
    <Panel className={styles.editor}>
      <PanelHead
        title="Your accounts"
        hint="Shared by every outlook — the market is what changes between them"
      />

      <div className={styles.grid}>
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

      <div className={styles.actions}>
        <Button onClick={model.addAccount}>Add an account</Button>
      </div>
    </Panel>
  );
}
