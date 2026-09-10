"use client";

import { formatMoney } from "@/lib/format";
import { formatMonth, parseMonth } from "@/lib/dates";
import type { LinkResolution, MortgageSource } from "@/lib/links";
import type { RetirementProfile } from "@/lib/types";
import { Panel } from "../ui/Panel";
import { MonthField, NumericField, TextSelectField } from "../ui/Field";
import styles from "./ProfilePanel.module.css";

interface ProfilePanelProps {
  profile: RetirementProfile;
  /** The age the active outlook solves to, or null while the inputs don't project. */
  retirementAge: number | null;
  presenting: boolean;
  /** The mortgage tool's scenarios, or null until its stored state has been read. */
  mortgage: MortgageSource | null;
  /** How the mortgage link is faring, or null when the figures were typed in. */
  resolution: LinkResolution | null;
  onChange: <K extends keyof RetirementProfile>(field: K, value: RetirementProfile[K]) => void;
  onLink: (scenarioId: string | null) => void;
}

/** The option value standing for "not linked to anything". */
const TYPED = "";

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
  mortgage,
  resolution,
  onChange,
  onLink,
}: ProfilePanelProps) {
  const mortgageEnds = profile.mortgagePayoff
    ? formatMonth(parseMonth(profile.mortgagePayoff))
    : "no end set";

  if (presenting) {
    return (
      <Panel bare className={styles.panel}>
        <div className={styles.chips}>
          <Chip label="Age today" value={String(profile.currentAge)} />
          <Chip label="Money lasts to" value={String(profile.endAge)} />
          <Chip label="Salary" value={formatMoney(profile.salary)} />
          <Chip label="Mortgage ends" value={mortgageEnds} />
          {retirementAge !== null ? <Chip label="Retire at" value={String(retirementAge)} /> : null}
        </div>
      </Panel>
    );
  }

  const linkedId = profile.mortgageLink?.scenarioId ?? TYPED;
  const linked = Boolean(profile.mortgageLink);

  /*
   * "Typed in here" plus every scenario. A link whose scenario has since been
   * deleted keeps an option of its own: without one the select would fall back
   * to showing "typed in here", which is the opposite of what is going on.
   */
  const sourceOptions = [
    { value: TYPED, label: "Typed in here" },
    ...(mortgage?.scenarios ?? []).map((scenario) => ({
      value: scenario.id,
      label: scenario.name || "Untitled scenario",
    })),
    ...(linked && !(mortgage?.scenarios ?? []).some((scenario) => scenario.id === linkedId)
      ? [{ value: linkedId, label: "Deleted scenario" }]
      : []),
  ];

  return (
    <Panel className={styles.panel}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>You &mdash; applies to every outlook</div>
        <div className={styles.eyebrow}>
          {retirementAge !== null
            ? `${Math.max(0, retirementAge - profile.currentAge)} years to go on this outlook`
            : " "}
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

        {/* Only offered once the mortgage tool's own figures have been read:
            until then there are no scenarios to list. */}
        {mortgage ? (
          <TextSelectField
            id="profile-mortgage-source"
            label="Mortgage figures from"
            value={linkedId}
            options={sourceOptions}
            onChange={(value) => onLink(value === TYPED ? null : value)}
          />
        ) : null}

        <NumericField
          id="profile-mortgage"
          label="Mortgage payment"
          prefix="$"
          step={25}
          value={profile.mortgagePayment}
          disabled={linked}
          onChange={(value) => onChange("mortgagePayment", value)}
        />
        <MonthField
          id="profile-mortgage-payoff"
          label="Mortgage paid off"
          value={profile.mortgagePayoff}
          disabled={linked}
          onChange={(value) => onChange("mortgagePayoff", value)}
        />
      </div>

      {resolution && resolution.status !== "pending" ? (
        <p
          className={`${styles.linkNote} ${resolution.status === "live" ? "" : styles.linkWarning}`}
        >
          {resolution.status === "live"
            ? `From the mortgage tool · ${resolution.scenarioName} · ${resolution.note} The payment includes that scenario's extra principal, because the payoff date assumes you are paying it.`
            : resolution.note}
        </p>
      ) : null}
    </Panel>
  );
}
