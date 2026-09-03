"use client";

import type { ReactNode } from "react";
import { formatDayLong } from "@/lib/days";
import { formatMoney } from "@/lib/format";
import type { Occurrence, StackedOccurrence } from "@/lib/types";
import styles from "./OccurrenceCard.module.css";

/**
 * Where the card sits: floating over the chart at a percentage across it (the
 * horizontal timeline, tracking the hovered column), or pinned below the chart
 * in normal flow (the vertical timeline, where a phone has nowhere to float a
 * card without covering the marks it describes).
 */
export type CardPlacement = { kind: "float"; left: number } | { kind: "pinned" };

interface OccurrenceCardProps {
  occurrence: Occurrence;
  /** The payment's name, already resolved (with a fallback) by the caller. */
  name: string;
  accent: string;
  /** The one line that differs between the tools — category · kind · cadence
   *  for expenses, cadence alone for income. */
  meta: ReactNode;
  /** Where this payment sits in its day's stack, when it shares the date. */
  stack: StackedOccurrence | undefined;
  /** Plural noun for the shared-day total: "sources" / "expenses". */
  peerNoun: { one: string; many: string };
  placement: CardPlacement;
}

/** What one payment is, on hover or tap. */
export function OccurrenceCard({
  occurrence,
  name,
  accent,
  meta,
  stack,
  peerNoun,
  placement,
}: OccurrenceCardProps) {
  const shared = stack !== undefined && stack.count > 1;
  // Clamped away from both edges so a floating card never runs off the panel,
  // the same edge-awareness the payoff marker's label uses.
  const style =
    placement.kind === "float"
      ? { left: `${Math.max(9, Math.min(91, placement.left))}%`, ["--accent" as string]: accent }
      : { ["--accent" as string]: accent };

  return (
    <div
      className={`${styles.tip} ${placement.kind === "pinned" ? styles.tipPinned : ""}`}
      style={style}
    >
      <div className={styles.name}>{name}</div>
      <div className={styles.amount}>{formatMoney(occurrence.amount)}</div>
      <div className={styles.meta}>{formatDayLong(occurrence.day)}</div>
      {meta ? <div className={styles.meta}>{meta}</div> : null}
      {/* One band of a column reads as the wrong number without the column
          behind it, so a shared day names its own total. */}
      {shared ? (
        <div className={styles.total}>
          {formatMoney(stack.total)} that day, across {stack.count}{" "}
          {stack.count === 1 ? peerNoun.one : peerNoun.many}
        </div>
      ) : null}
    </div>
  );
}
