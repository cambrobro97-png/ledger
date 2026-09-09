"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { InputShell, TextSelectField, fieldStyles } from "@/components/ui/Field";
import { MONTH_NAMES } from "@/lib/dates";
import { formatDayValue, parseDay } from "@/lib/days";
import { formatMoney } from "@/lib/format";
import { MORTGAGE_PART_LABELS, type LinkResolution } from "@/lib/links";
import {
  CADENCE_LABELS,
  CADENCE_ORDER,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  KIND_LABELS,
  KIND_ORDER,
  annualCostOf,
  categoryAccent,
  describeCadence,
} from "@/lib/expenses";
import type { Cadence, ExpenseCategory, ExpenseItem, ExpenseKind } from "@/lib/types";
import styles from "./ExpenseItemRow.module.css";

interface ExpenseItemRowProps {
  item: ExpenseItem;
  year: number;
  /** What this expense costs across the year on screen. */
  total: number;
  hovered: boolean;
  /** How the link is faring, for a line another tool drives. */
  resolution?: LinkResolution;
  onChange: (patch: Partial<ExpenseItem>) => void;
  onRemove: () => void;
  /** Keeps the figures, drops the link. Only called for a linked line. */
  onUnlink: () => void;
  onHover: (hovered: boolean) => void;
}

const CADENCE_OPTIONS = CADENCE_ORDER.map((cadence) => ({
  value: cadence,
  label: CADENCE_LABELS[cadence],
}));

const CATEGORY_OPTIONS = CATEGORY_ORDER.map((category) => ({
  value: category,
  label: CATEGORY_LABELS[category],
}));

const KIND_OPTIONS = KIND_ORDER.map((kind) => ({ value: kind, label: KIND_LABELS[kind] }));

/** One expense, edited in place. */
export function ExpenseItemRow({
  item,
  year,
  total,
  hovered,
  resolution,
  onChange,
  onRemove,
  onUnlink,
  onHover,
}: ExpenseItemRowProps) {
  const annual = annualCostOf(item);
  const link = item.link;
  const anchorDay = parseDay(item.anchor, year).day;

  return (
    <div
      className={`${styles.row} ${hovered ? styles.rowHovered : ""}`}
      style={{ ["--accent" as string]: categoryAccent(item.category) }}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      {link ? (
        <div className={styles.linkBar}>
          <Link
            href="/mortgage"
            className={styles.linkBadge}
            title={resolution?.note || undefined}
          >
            Mortgage &middot; {resolution?.scenarioName || "deleted scenario"} &middot;{" "}
            {MORTGAGE_PART_LABELS[link.part]}
          </Link>

          {/* Extra principal is money that genuinely leaves the account, but it
              is a choice rather than a bill — so whether it counts as spending
              is the one thing about this line still worth deciding. */}
          {link.part === "payment" ? (
            <label className={styles.linkToggle}>
              <input
                type="checkbox"
                checked={link.includeExtra}
                onChange={(event) =>
                  onChange({ link: { ...link, includeExtra: event.target.checked } })
                }
              />
              Count the extra principal
            </label>
          ) : null}

          <span className={styles.linkActions}>
            <Button variant="ghost" onClick={onUnlink} title="Keep these figures, drop the link">
              Unlink
            </Button>
          </span>

          {resolution && resolution.status !== "live" && resolution.status !== "pending" ? (
            <span className={styles.linkWarning}>{resolution.note}</span>
          ) : null}
        </div>
      ) : null}

      <div className={styles.grid}>
        <InputShell>
          <input
            className={fieldStyles.input}
            type="text"
            aria-label="Expense name"
            placeholder="Expense"
            value={item.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </InputShell>

        {link ? (
          <InputShell prefix="$">
            <span className={styles.derived} title={resolution?.note || undefined}>
              {formatMoney(item.amount)}
            </span>
          </InputShell>
        ) : (
          <InputShell prefix="$">
            <input
              className={fieldStyles.input}
              type="number"
              min={0}
              step={10}
              inputMode="decimal"
              aria-label="Amount per payment"
              value={item.amount}
              onChange={(event) => onChange({ amount: Number(event.target.value) || 0 })}
            />
          </InputShell>
        )}

        <TextSelectField<ExpenseCategory>
          ariaLabel="Category"
          value={item.category}
          options={CATEGORY_OPTIONS}
          onChange={(category) => onChange({ category })}
        />

        {link ? (
          <InputShell>
            <span className={styles.derived}>{CADENCE_LABELS[item.cadence]}</span>
          </InputShell>
        ) : (
          <TextSelectField<Cadence>
            value={item.cadence}
            options={CADENCE_OPTIONS}
            onChange={(cadence) => onChange({ cadence })}
          />
        )}

        {/* The mortgage tool works in whole months, so the day is the one part
            of a linked line's dates left to decide here. */}
        {link ? (
          <InputShell prefix="Day">
            <input
              className={fieldStyles.input}
              type="number"
              min={1}
              max={31}
              step={1}
              inputMode="numeric"
              aria-label="Day of the month"
              value={anchorDay}
              onChange={(event) => {
                const parsed = parseDay(item.anchor, year);
                const day = Math.min(31, Math.max(1, Number(event.target.value) || 1));
                onChange({ anchor: formatDayValue({ ...parsed, day }) });
              }}
            />
          </InputShell>
        ) : (
          <InputShell>
            <input
              className={fieldStyles.input}
              type="date"
              aria-label={item.cadence === "once" ? "Date" : "First payment"}
              value={item.anchor}
              onChange={(event) => onChange({ anchor: event.target.value })}
            />
          </InputShell>
        )}

        {/* A one-off has nothing to stop, so the end date gives up its cell
            rather than sitting there disabled. */}
        {item.cadence === "once" ? (
          <span className={styles.spacer} />
        ) : link ? (
          <InputShell prefix="Ends">
            <span className={styles.derived}>
              {item.until ? formatMonthOf(item.until) : "not set"}
            </span>
          </InputShell>
        ) : (
          <InputShell>
            <input
              className={fieldStyles.input}
              type="date"
              aria-label="Stops after (optional)"
              value={item.until}
              onChange={(event) => onChange({ until: event.target.value })}
            />
          </InputShell>
        )}

        <Button
          variant="danger"
          icon
          aria-label={`Remove ${item.name || "expense"}`}
          onClick={onRemove}
        >
          &times;
        </Button>
      </div>

      <div className={styles.foot}>
        <TextSelectField<ExpenseKind>
          ariaLabel="Fixed or variable"
          value={item.kind}
          options={KIND_OPTIONS}
          onChange={(kind) => onChange({ kind })}
        />

        <span className={styles.note}>{describeCadence(item, year)}</span>

        <span className={styles.totals}>
          {/* A quarterly premium's yearly cost is the number worth comparing
              against a monthly bill, so it sits next to the year's figure. */}
          {annual > 0 && item.cadence !== "annual" ? (
            <span className={styles.annual}>{formatMoney(annual)}/yr</span>
          ) : null}
          <span className={styles.total}>
            {formatMoney(total)} in {year}
          </span>
        </span>
      </div>
    </div>
  );
}

/** `YYYY-MM-DD` as "Mar 2039" — a linked line ends on a month, not a day. */
function formatMonthOf(value: string): string {
  const day = parseDay(value, 0);
  return `${MONTH_NAMES[day.month]} ${day.year}`;
}
