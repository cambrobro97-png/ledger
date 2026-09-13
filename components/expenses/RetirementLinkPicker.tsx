"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextSelectField } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";
import type { RetirementSource } from "@/lib/links";

interface RetirementLinkPickerProps {
  retirement: RetirementSource;
  onAdd: (accountId: string) => void;
  onClose: () => void;
}

/** Everything together, against one named account. */
const EVERY_ACCOUNT = "";

/**
 * Puts what is going into the retirement accounts on the expense list.
 *
 * It is money leaving the bank every month like any other outgoing, and the
 * cash-flow figures are a fiction without it. Unlike a mortgage line, only the
 * amount comes from the other tool: the day it leaves is the expense list's own,
 * and it has no end date — see `RetirementLink`.
 */
export function RetirementLinkPicker({ retirement, onAdd, onClose }: RetirementLinkPickerProps) {
  const [accountId, setAccountId] = useState(EVERY_ACCOUNT);

  const total = retirement.accounts.reduce(
    (sum, account) => sum + (Number(account.monthlyContribution) || 0),
    0,
  );

  const options = [
    { value: EVERY_ACCOUNT, label: `Every account — ${formatMoney(total)} a month` },
    ...retirement.accounts.map((account) => ({
      value: account.id,
      label: `${account.name || "Untitled account"} — ${formatMoney(Number(account.monthlyContribution) || 0)} a month`,
    })),
  ];

  return (
    <div className="mt-4 rounded-xl border border-rule bg-panel-2 p-4">
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="m-0 font-mono text-label font-normal uppercase tracking-[0.18em] text-ash">Take contributions from retirement</h3>
        <span className="text-sm text-ash">
          What you put away each month, counted as the outgoing it is
        </span>
      </div>

      {retirement.accounts.length === 0 ? (
        <p className="mb-3.5 mt-0 text-body text-ash">The retirement tool has no accounts to link to yet.</p>
      ) : (
        <div className="max-w-[320px]">
          <TextSelectField
            id="retirement-link-account"
            label="Contributions to"
            value={accountId}
            options={options}
            onChange={setAccountId}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        <Button
          onClick={() => {
            onAdd(accountId);
            onClose();
          }}
          disabled={retirement.accounts.length === 0 || total <= 0}
        >
          {total <= 0 ? "Nothing being contributed" : "Add the line"}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
