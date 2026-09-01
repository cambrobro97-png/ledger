"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./Field.module.css";

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function InputShell({
  prefix,
  suffix,
  children,
}: {
  prefix?: string;
  suffix?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      {prefix ? <span className={styles.affix}>{prefix}</span> : null}
      {children}
      {suffix ? <span className={styles.affix}>{suffix}</span> : null}
    </div>
  );
}

interface NumericFieldProps {
  id: string;
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  disabled?: boolean;
}

/**
 * A number input that lets you clear the box while typing instead of snapping
 * back to zero on every keystroke.
 */
export function NumericField({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  disabled,
}: NumericFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  return (
    <Field label={label} htmlFor={id}>
      <InputShell prefix={prefix} suffix={suffix}>
        <input
          id={id}
          className={styles.input}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          disabled={disabled}
          value={draft}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setDraft(String(value));
          }}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            const parsed = Number(next);
            onChange(next === "" || Number.isNaN(parsed) ? 0 : parsed);
          }}
        />
      </InputShell>
    </Field>
  );
}

export function MonthField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <InputShell>
        <input
          id={id}
          className={styles.input}
          type="month"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </InputShell>
    </Field>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  id: string;
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <InputShell>
        <select
          id={id}
          className={styles.select}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        >
          {options.map((option, index) => (
            <option key={option} value={index}>
              {option}
            </option>
          ))}
        </select>
      </InputShell>
    </Field>
  );
}

/** `SelectField` for string-valued options, such as a cadence. */
export function TextSelectField<T extends string>({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  options,
  disabled,
}: {
  id?: string;
  label?: ReactNode;
  /** Names an unlabelled select. Defaults to "Cadence", the first use of one. */
  ariaLabel?: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
}) {
  const select = (
    <InputShell>
      <select
        id={id}
        className={styles.select}
        value={value}
        disabled={disabled}
        aria-label={label ? undefined : (ariaLabel ?? "Cadence")}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </InputShell>
  );

  if (!label) return select;
  return (
    <Field label={label} htmlFor={id}>
      {select}
    </Field>
  );
}

/**
 * A labelled on/off switch. A real checkbox underneath, so it keeps keyboard
 * focus and the label's click target without any extra wiring.
 */
export function ToggleField({
  id,
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.toggleRow}>
      <input
        id={id}
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label className={styles.toggle} htmlFor={id}>
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        <span className={styles.toggleText}>
          <span className={styles.toggleLabel}>{label}</span>
          {hint ? <span className={styles.toggleHint}>{hint}</span> : null}
        </span>
      </label>
    </div>
  );
}

export const fieldStyles = styles;
