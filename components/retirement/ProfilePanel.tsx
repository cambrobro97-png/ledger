"use client";

import { formatMoney } from "@/lib/format";
import { formatMonth, parseMonth } from "@/lib/dates";
import type { RetirementProfile } from "@/lib/types";
import { Panel } from "../ui/Panel";
import { MonthField, NumericField } from "../ui/Field";
import styles from "./ProfilePanel.module.css";

interface ProfilePanelProps {
  profile: RetirementProfile;
  /** The age the active outlook solves to, or null while the inputs don't project. */
  retirementAge: number | null;
  presenting: boolean;
  onChange: <K extends keyof RetirementProfile>(field: K, value: RetirementProfile[K]) => void;
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.chip}>
      <span className={styles.chipKey}>{label}</span>
      <span className={styles.chipValue}>{value}</span>
    </div>
  );
}

/** The facts every outlook shares: edit them here, read them in presentation. */
export function ProfilePanel({
  profile,
  retirementAge,
  presenting,
  onChange,
}: ProfilePanelProps) {
  const mortgage = profile.mortgagePayoff
    ? formatMonth(parseMonth(profile.mortgagePayoff))
    : "no end set";

  if (presenting) {
    return (
      <Panel bare className={styles.panel}>
        <div className={styles.chips}>
          <Chip label="Age today" value={String(profile.currentAge)} />
          <Chip label="Money lasts to" value={String(profile.endAge)} />
          <Chip label="Salary" value={formatMoney(profile.salary)} />
          <Chip label="Mortgage ends" value={mortgage} />
          {retirementAge !== null ? <Chip label="Retire at" value={String(retirementAge)} /> : null}
        </div>
      </Panel>
    );
  }

  return (
    <Panel className={styles.panel}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>You &mdash; applies to every outlook</div>
        <div className={styles.eyebrow}>
          {retirementAge !== null
            ? `${Math.max(0, retirementAge - profile.currentAge)} years to go on this outlook`
            : " "}
        </div>
      </div>

      <div className={styles.fields}>
        <NumericField
          id="profile-age"
          label="Your age today"
          step={1}
          value={profile.currentAge}
          onChange={(value) => onChange("currentAge", value)}
        />
        <NumericField
          id="profile-end-age"
          label="Money has to last to"
          step={1}
          value={profile.endAge}
          onChange={(value) => onChange("endAge", value)}
        />
        <NumericField
          id="profile-salary"
          label="Gross salary"
          prefix="$"
          step={1000}
          value={profile.salary}
          onChange={(value) => onChange("salary", value)}
        />
        <MonthField
          id="profile-start"
          label="Balances as of"
          value={profile.start}
          onChange={(value) => onChange("start", value)}
        />
        <NumericField
          id="profile-mortgage"
          label="Mortgage payment"
          prefix="$"
          step={25}
          value={profile.mortgagePayment}
          onChange={(value) => onChange("mortgagePayment", value)}
        />
        <MonthField
          id="profile-mortgage-payoff"
          label="Mortgage paid off"
          value={profile.mortgagePayoff}
          onChange={(value) => onChange("mortgagePayoff", value)}
        />
      </div>
    </Panel>
  );
}
