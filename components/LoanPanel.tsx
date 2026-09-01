"use client";

import { formatMonth } from "@/lib/dates";
import { formatDuration, formatMoney, formatRate } from "@/lib/format";
import type { Amortization, Loan, Pmi } from "@/lib/types";
import { Panel } from "./ui/Panel";
import { MonthField, NumericField } from "./ui/Field";
import { PmiPanel } from "./PmiPanel";
import styles from "./LoanPanel.module.css";

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
    <div className={styles.chip}>
      <span className={styles.chipKey}>{label}</span>
      <span className={styles.chipValue}>{value}</span>
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
      <Panel bare className={styles.panel}>
        <div className={styles.chips}>
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
    <Panel className={styles.panel}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>The loan &mdash; applies to every scenario</div>
        <div className={styles.eyebrow}>
          {termLeft ? `${termLeft} left at the current payment` : "\u00a0"}
        </div>
      </div>

      <div className={styles.fields}>
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
