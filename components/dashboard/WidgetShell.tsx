"use client";

import type { ReactNode } from "react";
import styles from "./WidgetShell.module.css";

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
    <div className={styles.shell} style={{ ["--accent" as string]: accent }}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.body}>
        {hydrated ? (
          <>
            <div className={styles.value}>{value}</div>
            <div className={styles.detail}>{detail}</div>
            {note ? <div className={styles.note}>{note}</div> : null}
          </>
        ) : (
          // The stored figures arrive after mount, so for one frame there is
          // nothing true to show. Holding back just the number — at its own
          // size, in the rule colour — keeps the card's structure and height
          // identical before and after, so the real figure lands without
          // shifting anything.
          <>
            <div className={`${styles.value} ${styles.pending}`} aria-hidden="true">
              —
            </div>
            <div className={styles.detail}>Reading your figures…</div>
          </>
        )}

        {hydrated && children ? <div className={styles.extra}>{children}</div> : null}
      </div>
    </div>
  );
}
