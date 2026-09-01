"use client";

import { ACCOUNT_KIND_OPTIONS, describeAccount } from "@/lib/describeRetirement";
import { deferralLimitAt, overDeferralLimit } from "@/lib/retirement";
import { formatMoney } from "@/lib/format";
import { accentFor } from "@/lib/income";
import type { Account, AccountKind } from "@/lib/types";
import { Button } from "../ui/Button";
import { NumericField, TextSelectField } from "../ui/Field";
import styles from "./AccountCard.module.css";

interface AccountCardProps {
  account: Account;
  /** Drives the deferral-limit warning, which is age-dependent. */
  currentAge: number;
  canDelete: boolean;
  onChange: (patch: Partial<Account>) => void;
  onDelete: () => void;
}

/** Editor for a single account. Match fields appear only where they apply. */
export function AccountCard({
  account,
  currentAge,
  canDelete,
  onChange,
  onDelete,
}: AccountCardProps) {
  const is401k = account.kind === "401k";
  const over = overDeferralLimit(account, currentAge);

  return (
    <div className={styles.card} style={{ ["--accent" as string]: accentFor(account.accent) }}>
      <div className={styles.top}>
        <i className={styles.dot} />
        <input
          className={styles.name}
          aria-label="Account name"
          value={account.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <Button
          variant="danger"
          icon
          onClick={onDelete}
          disabled={!canDelete}
          aria-label="Delete account"
          title={canDelete ? "Delete account" : "Keep at least one account"}
        >
          &times;
        </Button>
      </div>

      <div className={styles.pair}>
        <TextSelectField<AccountKind>
          id={`${account.id}-kind`}
          label="Kind"
          value={account.kind}
          options={ACCOUNT_KIND_OPTIONS}
          onChange={(value) => onChange({ kind: value })}
        />
        <NumericField
          id={`${account.id}-balance`}
          label="Balance today"
          prefix="$"
          step={1000}
          value={account.balance}
          onChange={(value) => onChange({ balance: value })}
        />
      </div>

      <div className={`${styles.pair} ${styles.spaced}`}>
        <NumericField
          id={`${account.id}-return`}
          label="Annual return"
          suffix="%"
          step={0.1}
          value={account.returnRate}
          onChange={(value) => onChange({ returnRate: value })}
        />
        <NumericField
          id={`${account.id}-contribution`}
          label="Contribution"
          prefix="$"
          suffix="/mo"
          step={50}
          value={account.monthlyContribution}
          onChange={(value) => onChange({ monthlyContribution: value })}
        />
      </div>

      <div className={`${styles.pair} ${styles.spaced}`}>
        <NumericField
          id={`${account.id}-contribution-growth`}
          label="Contribution rises"
          suffix="%/yr"
          step={0.5}
          value={account.contributionGrowth}
          onChange={(value) => onChange({ contributionGrowth: value })}
        />
        {is401k ? (
          <NumericField
            id={`${account.id}-match-rate`}
            label="Employer matches"
            suffix="%"
            step={10}
            value={account.matchRate}
            onChange={(value) => onChange({ matchRate: value })}
          />
        ) : (
          <div />
        )}
      </div>

      {is401k ? (
        <div className={`${styles.pair} ${styles.spaced}`}>
          <NumericField
            id={`${account.id}-match-limit`}
            label="Up to this much of pay"
            suffix="%"
            step={0.5}
            value={account.matchLimitPct}
            onChange={(value) => onChange({ matchLimitPct: value })}
          />
          <div />
        </div>
      ) : null}

      {over !== null ? (
        <p className={styles.warning}>
          {formatMoney((Number(account.monthlyContribution) || 0) * 12)} a year is{" "}
          {formatMoney(over)} over the {formatMoney(deferralLimitAt(currentAge))} employee limit.
          The projection still counts it in full &mdash; tax rules come later.
        </p>
      ) : null}

      <div className={styles.note}>{describeAccount(account)}</div>
    </div>
  );
}
