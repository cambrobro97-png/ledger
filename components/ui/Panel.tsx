import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

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
  return (
    <section
      className={cn(
        "min-w-0 rounded-panel border py-panel",
        // Bare keeps the vertical rhythm and the border box, and drops only
        // what makes it read as a card.
        bare ? "border-transparent bg-transparent px-0" : "border-rule bg-panel px-panel",
        className,
      )}
    >
      {children}
    </section>
  );
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
    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-4">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      {title ? (
        <h2 className="m-0 font-display text-title font-medium tracking-title">{title}</h2>
      ) : null}
      {hint ? <div className="text-sm text-ash">{hint}</div> : null}
    </div>
  );
}
