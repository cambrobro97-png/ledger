"use client";

import { cn } from "@/lib/cn";

export interface Tab {
  id: string;
  name: string;
  /** A baseline-like entry: the dot goes grey, so it reads as the do-nothing case. */
  muted: boolean;
}

/**
 * The pill switcher shared by the mortgage scenarios and the retirement
 * outlooks. Those two components were identical but for a predicate and an
 * aria-label, and the second imported the first's stylesheet across
 * directories to say so.
 */
export function Tabs({
  tabs,
  activeId,
  presenting,
  label,
  onSelect,
}: {
  tabs: Tab[];
  activeId: string;
  presenting: boolean;
  label: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      className="scrollbar-none mt-[22px] flex gap-2.5 overflow-x-auto pb-1.5"
      role="tablist"
      aria-label={label}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className={cn(
            "flex-none cursor-pointer whitespace-nowrap rounded-full border border-rule bg-panel text-ash",
            "font-sans text-body font-medium leading-none transition duration-200",
            "hover:-translate-y-px hover:text-bone",
            "aria-selected:border-bone aria-selected:bg-bone aria-selected:text-ink",
            // Picked, not layered: two padding utilities on one element would
            // leave the cascade to decide which wins.
            presenting ? "px-6 py-[13px]" : "px-5 py-[11px]",
          )}
          aria-selected={tab.id === activeId}
          onClick={() => onSelect(tab.id)}
        >
          <i
            className={cn(
              "mr-[9px] inline-block h-[7px] w-[7px] rounded-full align-[1px]",
              tab.muted ? "bg-ash" : "bg-jade",
              tab.id === activeId ? "opacity-100" : "opacity-75",
            )}
          />
          {tab.name}
        </button>
      ))}
    </nav>
  );
}
