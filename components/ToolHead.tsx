"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./ui/Button";

/**
 * The eyebrow-and-title pair at the top of every tool.
 *
 * This used to be `TopBar.module.css`, which three other files imported for
 * these two classes — a shared component wearing a stylesheet's clothes. The
 * dashboard wants the heading without the bar around it, so the two are
 * separate exports rather than one component with a flag.
 */
export function ToolHeading({
  eyebrow,
  title,
  className,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="mx-0 mb-0 mt-[0.15em] font-display text-display font-bold leading-[1.05] tracking-title">
        {title}
      </h1>
    </div>
  );
}

export function ToolHead({
  eyebrow,
  title,
  presenting,
  onExitPresenting,
  className,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  presenting?: boolean;
  onExitPresenting?: () => void;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-wrap items-end justify-between gap-6 border-b border-rule pb-5", className)}
    >
      <ToolHeading eyebrow={eyebrow} title={title} />

      {/* The Edit / Present toggle is hidden while presentation mode is being
          reworked; Esc still leaves a session started from the keyboard. */}
      {presenting && onExitPresenting ? (
        <Button variant="ghost" className="inline-flex items-center gap-2" onClick={onExitPresenting}>
          Exit presentation <kbd>Esc</kbd>
        </Button>
      ) : null}
    </header>
  );
}
