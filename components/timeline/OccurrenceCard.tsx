"use client";

import type { ReactNode } from "react";
import { formatDayLong } from "@/lib/days";
import { formatMoney } from "@/lib/format";
import type { Occurrence, StackedOccurrence } from "@/lib/types";
import styles from "./OccurrenceCard.module.css";

/**
 * Where the card sits.
 *
 * `float` tracks the hovered column across the horizontal chart, positioned as
 * a percentage of its width. `anchored` places the card in CSS pixels beside
 * the tapped mark on the vertical chart, flipped above it when it would
 * otherwise run past the bottom of the plot — so it never covers the mark it
 * describes and never overflows the timeline's box.
 */
export type CardPlacement =
  | { kind: "float"; left: number }
  | { kind: "anchored"; left: number; top: number; flipped: boolean };

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
  const anchored = placement.kind === "anchored";
  // Clamped away from both edges so a floating card never runs off the panel,
  // the same edge-awareness the payoff marker's label uses. Anchored, the
  // caller has already clamped in pixels against the plot it knows the size of.
  const style =
    placement.kind === "float"
      ? { left: `${Math.max(9, Math.min(91, placement.left))}%`, ["--accent" as string]: accent }
      : { left: `${placement.left}px`, top: `${placement.top}px`, ["--accent" as string]: accent };

  return (
    <div
      className={`${styles.tip} ${
        anchored ? `${styles.tipAnchored} ${placement.flipped ? styles.tipFlipped : ""}` : ""
      }`}
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
