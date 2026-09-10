"use client";

import { formatMonth, isMonthValue, parseMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { MortgageRedirect, Projection, RetirementProfile } from "@/lib/types";
import { Panel, PanelHead } from "../ui/Panel";
import { NumericField, TextSelectField, ToggleField } from "../ui/Field";
import styles from "./RedirectPanel.module.css";

interface RedirectPanelProps {
  profile: RetirementProfile;
  redirect: MortgageRedirect;
  /** The active outlook's projection, with the redirect as it currently stands. */
  current: Projection | null;
  /** The same outlook with the redirect off, or null when it is off already. */
  withoutRedirect: Projection | null;
  onChange: <K extends keyof MortgageRedirect>(field: K, value: MortgageRedirect[K]) => void;
}

/** Spreading it across the accounts, rather than picking one. */
const SPREAD = "";

/**
 * What the mortgage payment does once the loan is paid off.
 *
 * The projection has always dropped the payment out of spending at payoff. The
 * question this asks is the other half of it: while you are still working, that
 * money doesn't have to be absorbed — it can go straight into the accounts, and
 * the panel says what that is worth in years and in money.
 */
export function RedirectPanel({
  profile,
  redirect,
  current,
  withoutRedirect,
  onChange,
}: RedirectPanelProps) {
  const monthly = Number(profile.mortgagePayment) || 0;
  const share = Math.min(100, Math.max(0, Number(redirect.share) || 0));
  const freed = monthly * (share / 100);

  const payoff = isMonthValue(profile.mortgagePayoff)
    ? formatMonth(parseMonth(profile.mortgagePayoff))
    : null;

  const accountOptions = [
    { value: SPREAD, label: "Spread across the accounts" },
    ...profile.accounts.map((account) => ({
      value: account.id,
      label: account.name || "Untitled account",
    })),
  ];

  // Comparing like with like: both are the active outlook, one with the
  // redirect and one without.
  const yearsEarlier =
    current && withoutRedirect && !current.shortfall && !withoutRedirect.shortfall
      ? withoutRedirect.retirementAge - current.retirementAge
      : 0;
  const extraAtEnd =
    current && withoutRedirect ? current.endingBalance - withoutRedirect.endingBalance : 0;

  return (
    <Panel className={styles.panel}>
      <PanelHead
        title="When the mortgage ends"
        hint="Applies while you are still working — retired, the payment ending already lowers what you draw"
      />

      <ToggleField
        id="redirect-enabled"
        label="Put the freed payment into savings"
        hint={
          payoff
            ? `${formatMoney(monthly)} a month stops in ${payoff}`
            : "Set a payoff month to say when it frees up"
        }
        checked={redirect.enabled}
        onChange={(checked) => onChange("enabled", checked)}
      />

      {redirect.enabled ? (
        <>
          <div className={styles.fields}>
            <NumericField
              id="redirect-share"
              label="How much of it"
              suffix="%"
              step={5}
              value={redirect.share}
              onChange={(value) => onChange("share", value)}
            />
            <TextSelectField
              id="redirect-account"
              label="Goes into"
              value={
                profile.accounts.some((account) => account.id === redirect.accountId)
                  ? redirect.accountId
                  : SPREAD
              }
              options={accountOptions}
              onChange={(value) => onChange("accountId", value)}
            />
          </div>

          {payoff === null ? (
            <p className={styles.warning}>
              The mortgage has no payoff month, so there is nothing for this to start from.
            </p>
          ) : monthly <= 0 ? (
            <p className={styles.warning}>
              The mortgage payment is zero, so there is nothing to redirect.
            </p>
          ) : (
            <p className={styles.verdict}>
              <strong>{formatMoney(freed)}</strong> a month frees up in {payoff}
              {withoutRedirect === null ? (
                "."
              ) : (
                <>
                  {" — worth "}
                  {yearsEarlier > 0 ? (
                    <>
                      retiring <strong>{yearsEarlier}</strong>{" "}
                      {yearsEarlier === 1 ? "year" : "years"} sooner
                      {extraAtEnd !== 0 ? " and " : "."}
                    </>
                  ) : null}
                  {extraAtEnd !== 0 ? (
                    <>
                      <strong>{formatMoney(Math.abs(extraAtEnd))}</strong>{" "}
                      {extraAtEnd > 0 ? "more" : "less"} at {profile.endAge}.
                    </>
                  ) : null}
                  {yearsEarlier <= 0 && extraAtEnd === 0
                    ? "nothing yet on this outlook — the money runs out before the mortgage does."
                    : null}
                </>
              )}
            </p>
          )}
        </>
      ) : null}
    </Panel>
  );
}
