"use client";

import { MONTH_NAMES } from "@/lib/dates";
import { describeExtras } from "@/lib/describe";
import type { Scenario } from "@/lib/types";
import { Button } from "./ui/Button";
import { NumericField, SelectField } from "./ui/Field";
import { OneTimeRow } from "./OneTimeRow";
import styles from "./ScenarioCard.module.css";

interface ScenarioCardProps {
  scenario: Scenario;
  active: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Scenario>) => void;
  onAddOneTime: () => void;
  onChangeOneTime: (oneTimeId: string, patch: { amount?: number; month?: string }) => void;
  onRemoveOneTime: (oneTimeId: string) => void;
  onDelete: () => void;
}

/** Editor for a single saved scenario. */
export function ScenarioCard({
  scenario,
  active,
  canDelete,
  onSelect,
  onChange,
  onAddOneTime,
  onChangeOneTime,
  onRemoveOneTime,
  onDelete,
}: ScenarioCardProps) {
  return (
    <div className={`${styles.card} ${active ? styles.active : ""}`}>
      <div className={styles.top}>
        <input
          className={styles.name}
          aria-label="Scenario name"
          value={scenario.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <Button icon onClick={onSelect} title="Show this scenario">
          Show
        </Button>
        <Button
          variant="danger"
          icon
          onClick={onDelete}
          disabled={!canDelete}
          aria-label="Delete scenario"
          title={canDelete ? "Delete scenario" : "Keep at least one scenario"}
        >
          &times;
        </Button>
      </div>

      <div className={styles.pair}>
        <NumericField
          id={`${scenario.id}-monthly`}
          label="Extra each month"
          prefix="$"
          step={25}
          value={scenario.monthly}
          onChange={(value) => onChange({ monthly: value })}
        />
        <NumericField
          id={`${scenario.id}-annual`}
          label="Extra once a year"
          prefix="$"
          step={100}
          value={scenario.annual}
          onChange={(value) => onChange({ annual: value })}
        />
      </div>

      <div className={`${styles.pair} ${styles.spaced}`}>
        <SelectField
          id={`${scenario.id}-annual-month`}
          label="Yearly payment lands in"
          value={scenario.annualMonth}
          options={MONTH_NAMES}
          onChange={(value) => onChange({ annualMonth: value })}
        />
        <div className={styles.addWrap}>
          <Button onClick={onAddOneTime}>Add a one-time payment</Button>
        </div>
      </div>

      {scenario.oneTimes.length > 0 ? (
        <div className={styles.oneTimes}>
          {scenario.oneTimes.map((payment) => (
            <OneTimeRow
              key={payment.id}
              payment={payment}
              onChange={(patch) => onChangeOneTime(payment.id, patch)}
              onRemove={() => onRemoveOneTime(payment.id)}
            />
          ))}
        </div>
      ) : null}

      <div className={styles.note}>{describeExtras(scenario)}</div>
    </div>
  );
}
