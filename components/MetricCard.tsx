"use client";

import type { ReactNode } from "react";
import styles from "./MetricCard.module.css";

export function MetricGrid({ children }: { children: ReactNode }) {
  return <section className={styles.grid}>{children}</section>;
}

export function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: ReactNode;
  accent: string;
}) {
  return (
    <div className={styles.card} style={{ ["--accent" as string]: accent }}>
      <div className={styles.key}>{label}</div>
      <div className={styles.value}>{value}</div>
      <div className={styles.detail}>{detail}</div>
    </div>
  );
}
