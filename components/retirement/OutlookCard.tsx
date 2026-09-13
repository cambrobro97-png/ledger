"use client";

import { cn } from "@/lib/cn";
import {
  WITHDRAWAL_NOTES,
  WITHDRAWAL_OPTIONS,
  describeScenario,
} from "@/lib/describeRetirement";
import { createSpendLink } from "@/lib/defaults";
import type { RetirementSpend } from "@/lib/links";
import type {
  RetirementScenario,
  SpendBasis,
  SpendLink,
  WithdrawalStrategy,
} from "@/lib/types";
import { Button } from "../ui/Button";
import { NumericField, TextSelectField } from "../ui/Field";

interface OutlookCardProps {
  scenario: RetirementScenario;
  active: boolean;
  canDelete: boolean;
  /** This outlook's spending, worked out against the expense list. */
  spend: RetirementSpend;
  /** False until the expense tool's stored state has been read. */
  expensesReady: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<RetirementScenario>) => void;
  onLinkSpend: (link: SpendLink | null) => void;
  onDelete: () => void;
}

/** The option value standing for "not linked to anything". */
const TYPED = "typed";

const SOURCE_OPTIONS = [
  { value: TYPED, label: "Typed in here" },
  { value: "expenses", label: "The expense list" },
];

const BASIS_OPTIONS: { value: SpendBasis; label: string }[] = [
  { value: "all", label: "Every repeating bill" },
  { value: "fixed", label: "Only the fixed ones" },
];

/** Editor for a single saved outlook. */
export function OutlookCard({
  scenario,
  active,
  canDelete,
  spend,
  expensesReady,
  onSelect,
  onChange,
  onLinkSpend,
  onDelete,
}: OutlookCardProps) {
  const link = scenario.spendLink;
  const resolution = spend.resolution;

  return (
    <div className={cn(
        "rounded-xl border bg-panel-2 p-[18px]",
        active ? "border-jade ring-1 ring-jade/25" : "border-rule",
      )}>
      <div className="mb-3.5 flex items-center gap-2.5">
        <input
          className="min-w-0 flex-1 rounded-lg border border-rule bg-ink px-2.5 py-[9px] font-sans text-lg text-bone"
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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
          value={link ? Math.round(spend.annual) : scenario.annualSpend}
          disabled={Boolean(link)}
          onChange={(value) => onChange({ annualSpend: value })}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
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

      <div className="mt-3">
        <TextSelectField<WithdrawalStrategy>
          id={`${scenario.id}-withdrawal`}
          label="Retirement spending comes from"
          value={scenario.withdrawal}
          options={WITHDRAWAL_OPTIONS}
          onChange={(value) => onChange({ withdrawal: value })}
        />
      </div>

      {/* Only offered once the expense tool's own figures have been read:
          until then there is no list to build a budget from. */}
      {expensesReady ? (
        <div className="mt-3">
          <TextSelectField
            id={`${scenario.id}-spend-source`}
            label="Spending comes from"
            value={link ? "expenses" : TYPED}
            options={SOURCE_OPTIONS}
            onChange={(value) => onLinkSpend(value === TYPED ? null : createSpendLink())}
          />
        </div>
      ) : null}

      {link ? (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <TextSelectField<SpendBasis>
            id={`${scenario.id}-spend-basis`}
            label="Which lines"
            value={link.basis}
            options={BASIS_OPTIONS}
            onChange={(basis) => onLinkSpend({ ...link, basis })}
          />
          <NumericField
            id={`${scenario.id}-spend-adjust`}
            label="Of today's spending"
            suffix="%"
            step={5}
            value={link.adjustPct}
            onChange={(adjustPct) => onLinkSpend({ ...link, adjustPct })}
          />
        </div>
      ) : null}

      {resolution && resolution.status !== "pending" ? (
        <div className={cn("mt-3 font-mono text-sm leading-[1.5]", resolution.status === "live" ? "text-ash" : "text-brass")}>
          {resolution.note}
        </div>
      ) : null}

      <div className="mt-3 font-mono text-sm leading-[1.5] text-ash">{WITHDRAWAL_NOTES[scenario.withdrawal]}</div>
      <div className="mt-3 font-mono text-sm leading-[1.5] text-ash">{describeScenario(scenario, spend.annual)}</div>
    </div>
  );
}
