"use client";

import type { ReactNode } from "react";

export function MetricGrid({ children }: { children: ReactNode }) {
  return <section className="mt-[clamp(24px,2.6vw,40px)] grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(215px,1fr))]">{children}</section>;
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
    <div
      className="relative overflow-hidden rounded-panel border border-rule bg-panel p-panel after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:bg-[var(--accent,var(--ash))] after:opacity-80 after:content-['']"
      style={{ ["--accent" as string]: accent }}
    >
      <div className="font-mono text-label uppercase tracking-[0.16em] text-ash">{label}</div>
      <div className="mt-2.5 font-mono text-display font-medium leading-[1.1] tabular-nums tracking-[-0.02em]">{value}</div>
      <div className="mt-2 text-body text-ash [&_strong]:font-medium [&_strong]:text-bone">{detail}</div>
    </div>
  );
}
