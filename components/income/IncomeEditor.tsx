"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHead } from "@/components/ui/Panel";
import type { IncomeModel } from "@/hooks/useIncomeModel";
import { IncomeItemRow } from "./IncomeItemRow";
import styles from "./IncomeEditor.module.css";

interface IncomeEditorProps {
  model: IncomeModel;
  hoveredItemId: string | null;
  onHoverItem: (id: string | null) => void;
}

/** The income list. Everything above it is drawn from these rows. */
export function IncomeEditor({ model, hoveredItemId, onHoverItem }: IncomeEditorProps) {
  const totals = useMemo(
    () => new Map(model.derived.bySource.map((source) => [source.itemId, source.total])),
    [model.derived.bySource],
  );

  return (
    <Panel className={styles.editor}>
      <PanelHead
        title="Where the money comes from"
        hint="Edits are saved automatically and stay put between visits"
      />

      {model.items.length > 0 ? (
        <div className={styles.list}>
          {model.items.map((item) => (
            <IncomeItemRow
              key={item.id}
              item={item}
              year={model.year}
              total={totals.get(item.id) ?? 0}
              hovered={hoveredItemId === item.id}
              onChange={(patch) => model.updateItem(item.id, patch)}
              onRemove={() => model.removeItem(item.id)}
              onHover={(hovered) => onHoverItem(hovered ? item.id : null)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No income yet. Add a source to fill the timeline.</p>
      )}

      <div className={styles.actions}>
        <Button onClick={model.addItem}>Add income</Button>
        <Button variant="ghost" onClick={model.resetAll}>
          Start over from the defaults
        </Button>
      </div>
    </Panel>
  );
}
