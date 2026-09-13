"use client";

import { cn } from "@/lib/cn";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHead } from "@/components/ui/Panel";
import type { ExpenseModel } from "@/hooks/useExpenseModel";
import { formatMoney } from "@/lib/format";
import type { ExpenseItem } from "@/lib/types";
import { ExpenseItemRow } from "./ExpenseItemRow";
import { MortgageLinkPicker } from "./MortgageLinkPicker";
import { RetirementLinkPicker } from "./RetirementLinkPicker";

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
  const [picking, setPicking] = useState<"mortgage" | "retirement" | null>(null);

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
      resolution={model.resolutions.get(item.id)}
      onChange={(patch) => model.updateItem(item.id, patch)}
      onRemove={() => model.removeItem(item.id)}
      onUnlink={() => model.unlinkItem(item.id)}
      onHover={(hovered) => onHoverItem(hovered ? item.id : null)}
    />
  );

  const oneTimeTotal = oneTime.reduce((sum, item) => sum + (totals.get(item.id) ?? 0), 0);

  return (
    <Panel className="mt-[clamp(24px,2.6vw,40px)]">
      <PanelHead
        title="Where the money goes"
        hint="Edits are saved automatically and stay put between visits"
      />

      {model.items.length === 0 ? (
        <p className="m-0 text-body text-ash">No expenses yet. Add one to fill the timeline.</p>
      ) : null}

      {recurring.length > 0 ? (
        <section>
          <div className="mb-2.5 mt-3.5 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="m-0 font-mono text-label font-normal uppercase tracking-[0.18em] text-ash">Recurring</h3>
            <span className="font-mono text-label tabular-nums text-ash">
              {recurring.length} {recurring.length === 1 ? "bill" : "bills"} ·{" "}
              {formatMoney(model.derived.recurringAnnual)} a year
            </span>
          </div>
          <div className="grid gap-3">{recurring.map(renderRow)}</div>
        </section>
      ) : null}

      {oneTime.length > 0 ? (
        <section className={cn(recurring.length > 0 && "mt-[clamp(18px,2vw,28px)]")}>
          <div className="mb-2.5 mt-3.5 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="m-0 font-mono text-label font-normal uppercase tracking-[0.18em] text-ash">One time</h3>
            <span className="font-mono text-label tabular-nums text-ash">
              {oneTime.length} {oneTime.length === 1 ? "cost" : "costs"} ·{" "}
              {formatMoney(oneTimeTotal)} in {model.year}
            </span>
          </div>
          <div className="grid gap-3">{oneTime.map(renderRow)}</div>
        </section>
      ) : null}

      {picking === "mortgage" && model.mortgage ? (
        <MortgageLinkPicker
          mortgage={model.mortgage}
          items={model.items}
          onAdd={model.addMortgageLink}
          onClose={() => setPicking(null)}
        />
      ) : null}

      {picking === "retirement" && model.retirement ? (
        <RetirementLinkPicker
          retirement={model.retirement}
          onAdd={model.addRetirementLink}
          onClose={() => setPicking(null)}
        />
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2.5">
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
        {/* Only once the mortgage tool's own figures have been read: until
            then there is nothing to list, and no dates to work the lines out
            against. */}
        {model.mortgage && !picking ? (
          <Button variant="ghost" onClick={() => setPicking("mortgage")}>
            Take a line from the mortgage
          </Button>
        ) : null}
        {model.retirement && !picking ? (
          <Button variant="ghost" onClick={() => setPicking("retirement")}>
            Take contributions from retirement
          </Button>
        ) : null}
        <Button variant="ghost" onClick={model.resetAll}>
          Start over from the defaults
        </Button>
      </div>
    </Panel>
  );
}
