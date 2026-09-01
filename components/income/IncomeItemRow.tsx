"use client";

import { Button } from "@/components/ui/Button";
import { InputShell, TextSelectField, fieldStyles } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";
import { ACCENTS, CADENCE_LABELS, CADENCE_ORDER, accentFor, describeCadence } from "@/lib/income";
import type { Cadence, IncomeItem } from "@/lib/types";
import styles from "./IncomeItemRow.module.css";

interface IncomeItemRowProps {
  item: IncomeItem;
  year: number;
  /** Gross this source contributes to the year on screen. */
  total: number;
  hovered: boolean;
  onChange: (patch: Partial<IncomeItem>) => void;
  onRemove: () => void;
  onHover: (hovered: boolean) => void;
}

const CADENCE_OPTIONS = CADENCE_ORDER.map((cadence) => ({
  value: cadence,
  label: CADENCE_LABELS[cadence],
}));

/** One source of income, edited in place. */
export function IncomeItemRow({
  item,
  year,
  total,
  hovered,
  onChange,
  onRemove,
  onHover,
}: IncomeItemRowProps) {
  return (
    <div
      className={`${styles.row} ${hovered ? styles.rowHovered : ""}`}
      style={{ ["--accent" as string]: accentFor(item.accent) }}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <div className={styles.grid}>
        <InputShell>
          <input
            className={fieldStyles.input}
            type="text"
            aria-label="Source name"
            placeholder="Source"
            value={item.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </InputShell>

        <InputShell prefix="$">
          <input
            className={fieldStyles.input}
            type="number"
            min={0}
            step={50}
            inputMode="decimal"
            aria-label="Amount per payment"
            value={item.amount}
            onChange={(event) => onChange({ amount: Number(event.target.value) || 0 })}
          />
        </InputShell>

        <TextSelectField<Cadence>
          value={item.cadence}
          options={CADENCE_OPTIONS}
          onChange={(cadence) => onChange({ cadence })}
        />

        <InputShell>
          <input
            className={fieldStyles.input}
            type="date"
            aria-label="First payment"
            value={item.anchor}
            onChange={(event) => onChange({ anchor: event.target.value })}
          />
        </InputShell>

        <InputShell>
          <input
            className={fieldStyles.input}
            type="date"
            aria-label="Stops after (optional)"
            value={item.until}
            onChange={(event) => onChange({ until: event.target.value })}
          />
        </InputShell>

        <Button variant="danger" icon aria-label={`Remove ${item.name || "income"}`} onClick={onRemove}>
          &times;
        </Button>
      </div>

      <div className={styles.foot}>
        <button
          type="button"
          className={styles.swatches}
          aria-label="Change colour"
          onClick={() => onChange({ accent: item.accent + 1 })}
        >
          {ACCENTS.map((colour, index) => (
            <i
              key={colour}
              className={index === item.accent % ACCENTS.length ? styles.swatchOn : styles.swatch}
              style={{ background: colour }}
            />
          ))}
        </button>
        <span className={styles.note}>{describeCadence(item, year)}</span>
        <span className={styles.total}>{formatMoney(total)} in {year}</span>
      </div>
    </div>
  );
}
