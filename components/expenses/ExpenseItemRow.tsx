"use client";

import { Button } from "@/components/ui/Button";
import { InputShell, TextSelectField, fieldStyles } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";
import {
  CADENCE_LABELS,
  CADENCE_ORDER,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  KIND_LABELS,
  KIND_ORDER,
  annualCostOf,
  categoryAccent,
  describeCadence,
} from "@/lib/expenses";
import type { Cadence, ExpenseCategory, ExpenseItem, ExpenseKind } from "@/lib/types";
import styles from "./ExpenseItemRow.module.css";

interface ExpenseItemRowProps {
  item: ExpenseItem;
  year: number;
  /** What this expense costs across the year on screen. */
  total: number;
  hovered: boolean;
  onChange: (patch: Partial<ExpenseItem>) => void;
  onRemove: () => void;
  onHover: (hovered: boolean) => void;
}

const CADENCE_OPTIONS = CADENCE_ORDER.map((cadence) => ({
  value: cadence,
  label: CADENCE_LABELS[cadence],
}));

const CATEGORY_OPTIONS = CATEGORY_ORDER.map((category) => ({
  value: category,
  label: CATEGORY_LABELS[category],
}));

const KIND_OPTIONS = KIND_ORDER.map((kind) => ({ value: kind, label: KIND_LABELS[kind] }));

/** One expense, edited in place. */
export function ExpenseItemRow({
  item,
  year,
  total,
  hovered,
  onChange,
  onRemove,
  onHover,
}: ExpenseItemRowProps) {
  const annual = annualCostOf(item);

  return (
    <div
      className={`${styles.row} ${hovered ? styles.rowHovered : ""}`}
      style={{ ["--accent" as string]: categoryAccent(item.category) }}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <div className={styles.grid}>
        <InputShell>
          <input
            className={fieldStyles.input}
            type="text"
            aria-label="Expense name"
            placeholder="Expense"
            value={item.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </InputShell>

        <InputShell prefix="$">
          <input
            className={fieldStyles.input}
            type="number"
            min={0}
            step={10}
            inputMode="decimal"
            aria-label="Amount per payment"
            value={item.amount}
            onChange={(event) => onChange({ amount: Number(event.target.value) || 0 })}
          />
        </InputShell>

        <TextSelectField<ExpenseCategory>
          ariaLabel="Category"
          value={item.category}
          options={CATEGORY_OPTIONS}
          onChange={(category) => onChange({ category })}
        />

        <TextSelectField<Cadence>
          value={item.cadence}
          options={CADENCE_OPTIONS}
          onChange={(cadence) => onChange({ cadence })}
        />

        <InputShell>
          <input
            className={fieldStyles.input}
            type="date"
            aria-label={item.cadence === "once" ? "Date" : "First payment"}
            value={item.anchor}
            onChange={(event) => onChange({ anchor: event.target.value })}
          />
        </InputShell>

        {/* A one-off has nothing to stop, so the end date gives up its cell
            rather than sitting there disabled. */}
        {item.cadence === "once" ? (
          <span className={styles.spacer} />
        ) : (
          <InputShell>
            <input
              className={fieldStyles.input}
              type="date"
              aria-label="Stops after (optional)"
              value={item.until}
              onChange={(event) => onChange({ until: event.target.value })}
            />
          </InputShell>
        )}

        <Button
          variant="danger"
          icon
          aria-label={`Remove ${item.name || "expense"}`}
          onClick={onRemove}
        >
          &times;
        </Button>
      </div>

      <div className={styles.foot}>
        <TextSelectField<ExpenseKind>
          ariaLabel="Fixed or variable"
          value={item.kind}
          options={KIND_OPTIONS}
          onChange={(kind) => onChange({ kind })}
        />

        <span className={styles.note}>{describeCadence(item, year)}</span>

        <span className={styles.totals}>
          {/* A quarterly premium's yearly cost is the number worth comparing
              against a monthly bill, so it sits next to the year's figure. */}
          {annual > 0 && item.cadence !== "annual" ? (
            <span className={styles.annual}>{formatMoney(annual)}/yr</span>
          ) : null}
          <span className={styles.total}>
            {formatMoney(total)} in {year}
          </span>
        </span>
      </div>
    </div>
  );
}
