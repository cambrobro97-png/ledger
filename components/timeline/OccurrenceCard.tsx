"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { formatDayLong } from "@/lib/days";
import { formatMoney } from "@/lib/format";
import type { Occurrence, StackedOccurrence } from "@/lib/types";

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
      className={cn(
        "pointer-events-none absolute top-1 z-[2] min-w-[150px] rounded-xl border border-rule",
        "border-l-[3px] border-l-[var(--accent,var(--ash))] bg-panel-2 px-3.5 py-2.5",
        "shadow-[0_14px_34px_rgba(0,0,0,0.45)]",
        anchored
          // Anchored beside the tapped mark: the caller clamps `left` against
          // the plot's own edges, which is exact where a percentage centre is
          // not, so the centring translate is dropped. Tappable, because
          // tapping the card is one of the ways to dismiss the selection.
          ? cn(
              "pointer-events-auto min-w-0 max-w-[min(280px,calc(100%-24px))]",
              // Flipped above the mark when the card would run past the bottom
              // of the plot. `top` still names the mark's edge; the shift is
              // what moves the card, so the renderer never needs its height.
              placement.flipped ? "-translate-y-full" : "transform-none",
            )
          : "-translate-x-1/2",
      )}
      style={style}
    >
      <div className="font-mono text-micro uppercase tracking-[0.16em] text-ash">{name}</div>
      <div className="mt-1 font-mono text-amount tabular-nums text-[var(--accent,var(--bone))]">{formatMoney(occurrence.amount)}</div>
      <div className="mt-[3px] text-sm text-ash">{formatDayLong(occurrence.day)}</div>
      {meta ? <div className="mt-[3px] text-sm text-ash">{meta}</div> : null}
      {/* One band of a column reads as the wrong number without the column
          behind it, so a shared day names its own total. */}
      {shared ? (
        <div className="mt-[7px] border-t border-rule pt-1.5 font-mono text-label tabular-nums text-ash">
          {formatMoney(stack.total)} that day, across {stack.count}{" "}
          {stack.count === 1 ? peerNoun.one : peerNoun.many}
        </div>
      ) : null}
    </div>
  );
}
