"use client";

import { MONTH_NAMES } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { describeExtras } from "@/lib/describe";
import { formatMoney } from "@/lib/format";
import type { SpareMoney } from "@/lib/links";
import type { Scenario } from "@/lib/types";
import { Button } from "./ui/Button";
import { NumericField, SelectField } from "./ui/Field";
import { OneTimeRow } from "./OneTimeRow";

interface ScenarioCardProps {
  scenario: Scenario;
  active: boolean;
  canDelete: boolean;
  /** What the income and expense lists leave over each month. */
  spare: SpareMoney;
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
  spare,
  onSelect,
  onChange,
  onAddOneTime,
  onChangeOneTime,
  onRemoveOneTime,
  onDelete,
}: ScenarioCardProps) {
  /*
   * Rounded down to whole dollars, and the same figure is both shown and used:
   * saying "$2,382 is spare" and then filling the field with 2,381 is a small
   * lie about a number someone is about to commit money against. Down rather
   * than to nearest, so the suggestion is never more than there is.
   */
  const spareMonthly = Math.max(0, Math.floor(spare.spare));
  const overspending =
    spare.known && spareMonthly > 0 && (Number(scenario.monthly) || 0) > spareMonthly;
  const useSpare = () => onChange({ monthly: spareMonthly });

  return (
    <div
      className={cn(
        "rounded-xl border bg-panel-2 p-[18px]",
        active ? "border-jade ring-1 ring-jade/25" : "border-rule",
      )}
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <input
          className="min-w-0 flex-1 rounded-lg border border-rule bg-ink px-2.5 py-[9px] font-sans text-lg text-bone"
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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SelectField
          id={`${scenario.id}-annual-month`}
          label="Yearly payment lands in"
          value={scenario.annualMonth}
          options={MONTH_NAMES}
          onChange={(value) => onChange({ annualMonth: value })}
        />
        <div className="flex items-end">
          <Button onClick={onAddOneTime}>Add a one-time payment</Button>
        </div>
      </div>

      {scenario.oneTimes.length > 0 ? (
        <div className="mt-3.5 flex flex-col gap-2.5">
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

      {/* What there is to pay with, from the other two tools. Only once they
          have something to say: an empty income list would otherwise report
          every scenario as unaffordable. */}
      {spare.known ? (
        <div className={cn("mt-3 font-mono text-sm", overspending ? "text-brass" : "text-ash")}>
          {spareMonthly <= 0 ? (
            <>
              The bills already run past the income, so there is nothing spare for extra principal.
            </>
          ) : overspending ? (
            <>
              This asks for {formatMoney(scenario.monthly)} a month; {formatMoney(spareMonthly)} is
              spare once the bills are paid.
            </>
          ) : (
            <>
              {formatMoney(spareMonthly)} a month is spare once the bills are paid.{" "}
              <button
                type="button"
                className="cursor-pointer appearance-none border-none bg-transparent p-0 text-jade underline underline-offset-2 [font:inherit] hover:text-bone"
                onClick={useSpare}
              >
                Use it
              </button>
            </>
          )}
        </div>
      ) : null}

      <div className="mt-3 font-mono text-sm text-ash">{describeExtras(scenario)}</div>
    </div>
  );
}
