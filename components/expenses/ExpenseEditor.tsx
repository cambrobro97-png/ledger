"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHead } from "@/components/ui/Panel";
import type { ExpenseModel } from "@/hooks/useExpenseModel";
import { formatMoney } from "@/lib/format";
import type { ExpenseItem } from "@/lib/types";
import { ExpenseItemRow } from "./ExpenseItemRow";
import styles from "./ExpenseEditor.module.css";

interface ExpenseEditorProps {
  model: ExpenseModel;
  hoveredItemId: string | null;
  onHoverItem: (id: string | null) => void;
}

/**
 * The expense list. Everything above it is drawn from these rows.
 *
 * Recurring bills and one-offs are kept apart: the repeating lines are the
 * budget, and a one-time cost is an event against it. Mixed together, a
 * fifteen-line list gives no sense of which is which.
 */
export function ExpenseEditor({ model, hoveredItemId, onHoverItem }: ExpenseEditorProps) {
  const totals = useMemo(
    () => new Map(model.derived.byItem.map((entry) => [entry.itemId, entry.total])),
    [model.derived.byItem],
  );

  const { recurring, oneTime } = useMemo(() => {
    const recurring: ExpenseItem[] = [];
    const oneTime: ExpenseItem[] = [];
    for (const item of model.items) {
      (item.cadence === "once" ? oneTime : recurring).push(item);
    }
    return { recurring, oneTime };
  }, [model.items]);

  const renderRow = (item: ExpenseItem) => (
    <ExpenseItemRow
      key={item.id}
      item={item}
      year={model.year}
      total={totals.get(item.id) ?? 0}
      hovered={hoveredItemId === item.id}
      onChange={(patch) => model.updateItem(item.id, patch)}
      onRemove={() => model.removeItem(item.id)}
      onHover={(hovered) => onHoverItem(hovered ? item.id : null)}
    />
  );

  const oneTimeTotal = oneTime.reduce((sum, item) => sum + (totals.get(item.id) ?? 0), 0);

  return (
    <Panel className={styles.editor}>
      <PanelHead
        title="Where the money goes"
        hint="Edits are saved automatically and stay put between visits"
      />

      {model.items.length === 0 ? (
        <p className={styles.empty}>No expenses yet. Add one to fill the timeline.</p>
      ) : null}

      {recurring.length > 0 ? (
        <section className={styles.group}>
          <div className={styles.groupHead}>
            <h3 className={styles.groupTitle}>Recurring</h3>
            <span className={styles.groupMeta}>
              {recurring.length} {recurring.length === 1 ? "bill" : "bills"} ·{" "}
              {formatMoney(model.derived.recurringAnnual)} a year
            </span>
          </div>
          <div className={styles.list}>{recurring.map(renderRow)}</div>
        </section>
      ) : null}

      {oneTime.length > 0 ? (
        <section className={styles.group}>
          <div className={styles.groupHead}>
            <h3 className={styles.groupTitle}>One time</h3>
            <span className={styles.groupMeta}>
              {oneTime.length} {oneTime.length === 1 ? "cost" : "costs"} ·{" "}
              {formatMoney(oneTimeTotal)} in {model.year}
            </span>
          </div>
          <div className={styles.list}>{oneTime.map(renderRow)}</div>
        </section>
      ) : null}

      <div className={styles.actions}>
        <Button onClick={() => model.addItem({ cadence: "monthly" })}>Add recurring expense</Button>
        <Button
          variant="ghost"
          onClick={() =>
            model.addItem({
              name: "One-time expense",
              cadence: "once",
              kind: "variable",
              amount: 500,
            })
          }
        >
          Add one-time expense
        </Button>
        <Button variant="ghost" onClick={model.resetAll}>
          Start over from the defaults
        </Button>
      </div>
    </Panel>
  );
}
