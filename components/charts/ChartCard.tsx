"use client";

import type { ReactNode } from "react";
import { Panel, PanelHead } from "../ui/Panel";
import styles from "./charts.module.css";

export interface LegendEntry {
  label: string;
  color?: string;
  dashed?: boolean;
}

interface ChartCardProps {
  title: string;
  hint?: string;
  readout?: ReactNode;
  legend: LegendEntry[];
  children: ReactNode;
  className?: string;
}

/** Shared shell for the three charts: heading, hover readout, canvas, legend. */
export function ChartCard({
  title,
  hint,
  readout,
  legend,
  children,
  className,
}: ChartCardProps) {
  return (
    <Panel className={className}>
      <PanelHead title={title} hint={hint} />
      {readout !== undefined ? <div className={styles.readout}>{readout}</div> : null}
      {children}
      <div className={styles.legend}>
        {legend.map((entry) => (
          <span key={entry.label} className={styles.legendItem}>
            <i
              className={`${styles.swatch} ${entry.dashed ? styles.swatchLine : ""}`}
              style={entry.dashed ? undefined : { background: entry.color }}
            />
            {entry.label}
          </span>
        ))}
      </div>
    </Panel>
  );
}
