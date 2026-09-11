"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextSelectField } from "@/components/ui/Field";
import { type MortgageSource, mortgagePartOptions } from "@/lib/links";
import type { ExpenseItem, MortgagePart } from "@/lib/types";
import styles from "./MortgageLinkPicker.module.css";

interface MortgageLinkPickerProps {
  mortgage: MortgageSource;
  /** The expense list, for spotting pieces that are on it already. */
  items: ExpenseItem[];
  onAdd: (scenarioId: string, part: MortgagePart, oneTimeId?: string) => void;
  onClose: () => void;
}

/** The key a part is identified by within one scenario. */
function keyOf(part: MortgagePart, oneTimeId?: string): string {
  return oneTimeId ? `${part}:${oneTimeId}` : part;
}

/**
 * Puts a mortgage scenario on the expense list.
 *
 * A scenario is offered a piece at a time rather than as one line, because it
 * is several different rhythms — the payment every month, the premium until it
 * drops off, extra principal once a year, a lump sum on its own date — and each
 * lands on the timeline at its own dates.
 */
export function MortgageLinkPicker({ mortgage, items, onAdd, onClose }: MortgageLinkPickerProps) {
  const [scenarioId, setScenarioId] = useState(
    () => mortgage.activeId || mortgage.scenarios[0]?.id || "",
  );
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(["payment"]));

  const options = useMemo(
    () => mortgagePartOptions(mortgage, scenarioId),
    [mortgage, scenarioId],
  );

  // What this scenario already has on the list, so the same piece can't be
  // added twice without anyone noticing.
  const alreadyLinked = useMemo(() => {
    const keys = new Set<string>();
    for (const item of items) {
      const link = item.link;
      if (link?.source === "mortgage" && link.scenarioId === scenarioId) {
        keys.add(keyOf(link.part, link.oneTimeId));
      }
    }
    return keys;
  }, [items, scenarioId]);

  const scenarioOptions = mortgage.scenarios.map((scenario) => ({
    value: scenario.id,
    label: scenario.name || "Untitled scenario",
  }));

  const toggle = (key: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const selectable = options.filter(
    (option) => option.available && !alreadyLinked.has(option.key),
  );
  const selected = selectable.filter((option) => chosen.has(option.key));

  const add = () => {
    for (const option of selected) onAdd(scenarioId, option.part, option.oneTimeId);
    onClose();
  };

  return (
    <div className={styles.picker}>
      <div className={styles.head}>
        <h3 className={styles.title}>Take a line from the mortgage</h3>
        <span className={styles.hint}>
          Its money and dates stay in step with the mortgage tool
        </span>
      </div>

      {mortgage.scenarios.length === 0 ? (
        <p className={styles.empty}>The mortgage tool has no scenarios to link to yet.</p>
      ) : (
        <>
          <div className={styles.scenario}>
            <TextSelectField
              id="mortgage-link-scenario"
              label="Scenario"
              value={scenarioId}
              options={scenarioOptions}
              onChange={setScenarioId}
            />
          </div>

          <div className={styles.parts}>
            {options.map((option) => {
              const linked = alreadyLinked.has(option.key);
              const disabled = !option.available || linked;

              return (
                <label
                  key={option.key}
                  className={`${styles.part} ${disabled ? styles.partDisabled : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={!disabled && chosen.has(option.key)}
                    disabled={disabled}
                    onChange={() => toggle(option.key)}
                  />
                  <span>
                    <span className={styles.partLabel}>{option.label}</span>
                    <span className={styles.partDetail}>
                      {linked ? "Already on the list." : option.detail}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}

      <div className={styles.actions}>
        <Button onClick={add} disabled={selected.length === 0}>
          {selected.length === 0
            ? "Nothing selected"
            : `Add ${selected.length} ${selected.length === 1 ? "line" : "lines"}`}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
