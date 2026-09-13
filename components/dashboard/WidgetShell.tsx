"use client";

import type { ReactNode } from "react";

export interface WidgetShellProps {
  /** Context line above the title — usually the tool and the period shown. */
  eyebrow: string;
  title: string;
  /** The one figure. Rendered only once `hydrated`. */
  value: string;
  detail: ReactNode;
  /** Colours the value and the left rule. */
  accent: string;
  /**
   * False until the tool's stored figures have been read. Until then the shell
   * renders in full and only the figure is held back — see the placeholder
   * below.
   */
  hydrated: boolean;
  /** Optional caveat, e.g. two tools sitting on different years. */
  note?: ReactNode;
  /** Charts and the like, shown only at the larger sizes. */
  children?: ReactNode;
}

/**
 * The frame every widget renders through, so a board of them reads as one
 * thing rather than five unrelated cards.
 */
export function WidgetShell({
  eyebrow,
  title,
  value,
  detail,
  accent,
  hydrated,
  note,
  children,
}: WidgetShellProps) {
  return (
    <div
      // The owner tool's colour on the left edge, echoing MetricCard's rule.
      className="relative flex w-full min-w-0 flex-col overflow-hidden rounded-panel border border-rule bg-panel p-[clamp(14px,1.2vw,22px)] text-inherit no-underline transition-[border-color,background-color] duration-[180ms] ease-tween after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:bg-[var(--accent,var(--ash))] after:opacity-80 after:content-['']"
      style={{ ["--accent" as string]: accent }}
    >
      <div className="truncate font-mono text-label uppercase tracking-[0.16em] text-ash">{eyebrow}</div>
      <h2 className="mx-0 mb-0 mt-0.5 font-display text-lg font-medium leading-[1.15] tracking-title">{title}</h2>

      <div className="mt-auto pt-3.5">
        {hydrated ? (
          <>
            <div className="font-mono text-figure font-medium leading-[1.1] tabular-nums tracking-[-0.02em] text-[var(--accent,var(--bone))]">{value}</div>
            <div className="mt-1.5 text-base text-ash">{detail}</div>
            {note ? <div className="mt-2 font-mono text-label tracking-[0.04em] text-brass">{note}</div> : null}
          </>
        ) : (
          // The stored figures arrive after mount, so for one frame there is
          // nothing true to show. Holding back just the number — at its own
          // size, in the rule colour — keeps the card's structure and height
          // identical before and after, so the real figure lands without
          // shifting anything.
          <>
            <div className="font-mono text-figure font-medium leading-[1.1] tabular-nums tracking-[-0.02em] text-rule" aria-hidden="true">
              —
            </div>
            <div className="mt-1.5 text-base text-ash">Reading your figures…</div>
          </>
        )}

        {hydrated && children ? <div className="mt-3.5">{children}</div> : null}
      </div>
    </div>
  );
}
