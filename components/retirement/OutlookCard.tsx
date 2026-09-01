"use client";

import {
  WITHDRAWAL_NOTES,
  WITHDRAWAL_OPTIONS,
  describeScenario,
} from "@/lib/describeRetirement";
import type { RetirementScenario, WithdrawalStrategy } from "@/lib/types";
import { Button } from "../ui/Button";
import { NumericField, TextSelectField } from "../ui/Field";
import styles from "./OutlookCard.module.css";

interface OutlookCardProps {
  scenario: RetirementScenario;
  active: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<RetirementScenario>) => void;
  onDelete: () => void;
}

/** Editor for a single saved outlook. */
export function OutlookCard({
  scenario,
  active,
  canDelete,
  onSelect,
  onChange,
  onDelete,
}: OutlookCardProps) {
  return (
    <div className={`${styles.card} ${active ? styles.active : ""}`}>
      <div className={styles.top}>
        <input
          className={styles.name}
          aria-label="Outlook name"
          value={scenario.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <Button icon onClick={onSelect} title="Show this outlook">
          Show
        </Button>
        <Button
          variant="danger"
          icon
          onClick={onDelete}
          disabled={!canDelete}
          aria-label="Delete outlook"
          title={canDelete ? "Delete outlook" : "Keep at least one outlook"}
        >
          &times;
        </Button>
      </div>

      <div className={styles.pair}>
        <NumericField
          id={`${scenario.id}-shift`}
          label="Returns move by"
          suffix="pts"
          step={0.5}
          value={scenario.marketShift}
          onChange={(value) => onChange({ marketShift: value })}
        />
        <NumericField
          id={`${scenario.id}-spend`}
          label="Spending a year"
          prefix="$"
          step={1000}
          value={scenario.annualSpend}
          onChange={(value) => onChange({ annualSpend: value })}
        />
      </div>

      <div className={`${styles.pair} ${styles.spaced}`}>
        <NumericField
          id={`${scenario.id}-inflation`}
          label="Inflation"
          suffix="%"
          step={0.1}
          value={scenario.inflation}
          onChange={(value) => onChange({ inflation: value })}
        />
        <NumericField
          id={`${scenario.id}-cola`}
          label="Lifestyle creep"
          suffix="%"
          step={0.1}
          value={scenario.colaIncrease}
          onChange={(value) => onChange({ colaIncrease: value })}
        />
      </div>

      <div className={styles.spaced}>
        <TextSelectField<WithdrawalStrategy>
          id={`${scenario.id}-withdrawal`}
          label="Retirement spending comes from"
          value={scenario.withdrawal}
          options={WITHDRAWAL_OPTIONS}
          onChange={(value) => onChange({ withdrawal: value })}
        />
      </div>

      <div className={styles.note}>{WITHDRAWAL_NOTES[scenario.withdrawal]}</div>
      <div className={styles.note}>{describeScenario(scenario)}</div>
    </div>
  );
}
