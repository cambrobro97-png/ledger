"use client";

import { formatMonth } from "@/lib/dates";
import { formatDuration, formatMoney, formatRate } from "@/lib/format";
import type { Amortization, Loan, Pmi } from "@/lib/types";
import { Panel } from "./ui/Panel";
import { MonthField, NumericField } from "./ui/Field";
import { PmiPanel } from "./PmiPanel";

interface LoanPanelProps {
  loan: Loan;
  /** Payments left at the scheduled payment, or null when the inputs don't amortize. */
  baselineMonths: number | null;
  presenting: boolean;
  onChange: <K extends keyof Loan>(field: K, value: Loan[K]) => void;
  pmi: Pmi;
  /** The active scenario's run, for the PMI drop-off readout. */
  current: Amortization | null;
  onPmiChange: <K extends keyof Pmi>(field: K, value: Pmi[K]) => void;
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-label uppercase tracking-[0.14em] text-ash">{label}</span>
      <span className="font-mono text-title font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** The loan terms every scenario shares: edit them here, read them in presentation. */
export function LoanPanel({
  loan,
  baselineMonths,
  presenting,
  onChange,
  pmi,
  current,
  onPmiChange,
}: LoanPanelProps) {
  const termLeft = baselineMonths === null ? null : formatDuration(baselineMonths);
  const dropOff = pmi.enabled ? current?.pmi?.dropOffDate ?? null : null;

  if (presenting) {
    return (
      <Panel bare className="mt-5">
        <div className="flex flex-wrap gap-x-7 gap-y-2.5">
          <Chip label="Balance" value={formatMoney(loan.balance)} />
          <Chip label="Rate" value={formatRate(loan.apr)} />
          <Chip label="Payment" value={`${formatMoney(loan.payment)}/mo`} />
          {termLeft ? <Chip label="Term left" value={termLeft} /> : null}
          {dropOff ? <Chip label="PMI ends" value={formatMonth(dropOff)} /> : null}
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="mt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="eyebrow">The loan &mdash; applies to every scenario</div>
        <div className="eyebrow">
          {termLeft ? `${termLeft} left at the current payment` : "\u00a0"}
        </div>
      </div>

      <div className="mt-3.5 grid gap-x-7 gap-y-3.5 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        <NumericField
          id="loan-balance"
          label="Current balance"
          prefix="$"
          step={100}
          value={loan.balance}
          onChange={(value) => onChange("balance", value)}
        />
        <NumericField
          id="loan-apr"
          label="Interest rate"
          suffix="% APR"
          step={0.001}
          value={loan.apr}
          onChange={(value) => onChange("apr", value)}
        />
        <NumericField
          id="loan-payment"
          label="Monthly payment (principal & interest)"
          prefix="$"
          step={10}
          value={loan.payment}
          onChange={(value) => onChange("payment", value)}
        />
        <MonthField
          id="loan-start"
          label="Balance as of"
          value={loan.start}
          onChange={(value) => onChange("start", value)}
        />
      </div>

      <PmiPanel pmi={pmi} balance={loan.balance} current={current} onChange={onPmiChange} />
    </Panel>
  );
}
