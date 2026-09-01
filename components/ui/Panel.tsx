import type { ReactNode } from "react";
import styles from "./Panel.module.css";

/** The card shell shared by the loan panel, chart cards, and the editor. */
export function Panel({
  children,
  bare,
  className,
}: {
  children: ReactNode;
  bare?: boolean;
  className?: string;
}) {
  const classes = [styles.panel, bare ? styles.bare : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  return <section className={classes}>{children}</section>;
}

export function PanelHead({
  title,
  hint,
  eyebrow,
}: {
  title?: ReactNode;
  hint?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className={styles.head}>
      {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
}

export const panelStyles = styles;
