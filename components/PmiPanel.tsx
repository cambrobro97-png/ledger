"use client";

import { formatMonth } from "@/lib/dates";
import { formatDuration, formatMoney } from "@/lib/format";
import type { Amortization, Pmi } from "@/lib/types";
import { NumericField, ToggleField } from "./ui/Field";
import styles from "./PmiPanel.module.css";

interface PmiPanelProps {
  pmi: Pmi;
  /** Current balance, for the live loan-to-value readout. */
  balance: number;
  /** The active scenario's run, which is where the drop-off month comes from. */
  current: Amortization | null;
  onChange: <K extends keyof Pmi>(field: K, value: Pmi[K]) => void;
}

/**
 * The optional PMI layer: when the premium stops, and what happens to that
 * money afterwards. Collapsed to a single switch until it's turned on.
 */
export function PmiPanel({ pmi, balance, current, onChange }: PmiPanelProps) {
  const homeValue = Number(pmi.homeValue) || 0;
  const ltv = homeValue > 0 ? (balance / homeValue) * 100 : null;
  const outcome = current?.pmi ?? null;
  // Already below the threshold on day one: there is no premium left to drop.
  const alreadyBelow = ltv !== null && ltv <= (Number(pmi.dropOffLtv) || 0);

  return (
    <div className={styles.section}>
      <ToggleField
        id="pmi-enabled"
        label="Account for PMI dropping off"
        hint="Stops the premium at your equity threshold, and can put it toward principal"
        checked={pmi.enabled}
        onChange={(checked) => onChange("enabled", checked)}
      />

      {pmi.enabled ? (
        <>
          <div className={styles.fields}>
            <NumericField
              id="pmi-monthly"
              label="PMI premium"
              prefix="$"
              step={5}
              value={pmi.monthly}
              onChange={(value) => onChange("monthly", value)}
            />
            <NumericField
              id="pmi-home-value"
              label="Home value"
              prefix="$"
              step={1000}
              value={pmi.homeValue}
              onChange={(value) => onChange("homeValue", value)}
            />
            <NumericField
              id="pmi-ltv"
              label="Drops off at"
              suffix="% LTV"
              step={1}
              value={pmi.dropOffLtv}
              onChange={(value) => onChange("dropOffLtv", value)}
            />
          </div>

          <ToggleField
            id="pmi-reinvest"
            label="Put the freed-up premium toward principal"
            hint="The money is already in the budget, so redirecting it costs nothing new"
            checked={pmi.reinvest}
            onChange={(checked) => onChange("reinvest", checked)}
          />

          <PmiReadout
            ltv={ltv}
            alreadyBelow={alreadyBelow}
            premium={Number(pmi.monthly) || 0}
            reinvest={pmi.reinvest}
            outcome={outcome}
          />
        </>
      ) : null}
    </div>
  );
}

function PmiReadout({
  ltv,
  alreadyBelow,
  premium,
  reinvest,
  outcome,
}: {
  ltv: number | null;
  alreadyBelow: boolean;
  premium: number;
  reinvest: boolean;
  outcome: Amortization["pmi"];
}) {
  if (ltv === null) {
    return <p className={styles.note}>Enter what the home is worth to see when PMI ends.</p>;
  }

  if (alreadyBelow) {
    return (
      <p className={styles.note}>
        At <strong>{ltv.toFixed(1)}%</strong> LTV you&rsquo;re already past the threshold &mdash; no
        premium is being charged, so there&rsquo;s nothing to drop.
      </p>
    );
  }

  // No drop-off worth reporting: either the balance never reaches the threshold,
  // or it only gets there on the final payment, which is too late to matter.
  if (!outcome || outcome.dropOffMonth === null || !outcome.dropOffDate) {
    return (
      <p className={styles.note}>
        At <strong>{ltv.toFixed(1)}%</strong> LTV the loan is paid off before the premium has a
        chance to come off, so there&rsquo;s nothing to redirect &mdash;{" "}
        <strong>{formatMoney(outcome?.totalPaid ?? 0)}</strong> of premium along the way.
      </p>
    );
  }

  return (
    <p className={styles.note}>
      At <strong>{ltv.toFixed(1)}%</strong> LTV the premium stops in{" "}
      <strong>{formatMonth(outcome.dropOffDate)}</strong> &mdash;{" "}
      {formatDuration(outcome.dropOffMonth - 1)} of payments, {formatMoney(outcome.totalPaid)} of
      premium.{" "}
      {reinvest ? (
        <>
          After that, {formatMoney(premium)} a month goes to principal:{" "}
          <strong>{formatMoney(outcome.totalReinvested)}</strong> over the life of the loan.
        </>
      ) : (
        <>Turn on the switch above to put that {formatMoney(premium)} toward principal instead.</>
      )}
    </p>
  );
}
