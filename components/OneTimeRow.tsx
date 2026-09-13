"use client";

import type { OneTimePayment } from "@/lib/types";
import { Button } from "./ui/Button";
import { InputShell, fieldStyles } from "./ui/Field";

interface OneTimeRowProps {
  payment: OneTimePayment;
  disabled?: boolean;
  onChange: (patch: { amount?: number; month?: string }) => void;
  onRemove: () => void;
}

/** One lump sum: how much, and which month it lands in. */
export function OneTimeRow({ payment, disabled, onChange, onRemove }: OneTimeRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2.5">
      <InputShell prefix="$">
        <input
          className={fieldStyles.input}
          type="number"
          min={0}
          step={100}
          inputMode="decimal"
          aria-label="One-time amount"
          disabled={disabled}
          value={payment.amount}
          onChange={(event) => onChange({ amount: Number(event.target.value) || 0 })}
        />
      </InputShell>

      <InputShell>
        <input
          className={fieldStyles.input}
          type="month"
          aria-label="Month the payment lands"
          disabled={disabled}
          value={payment.month}
          onChange={(event) => onChange({ month: event.target.value })}
        />
      </InputShell>

      <Button
        variant="danger"
        icon
        aria-label="Remove one-time payment"
        disabled={disabled}
        onClick={onRemove}
      >
        &times;
      </Button>
    </div>
  );
}
