"use client";

import { Button } from "@/components/ui/Button";
import { MONTH_NAMES } from "@/lib/dates";

interface YearSwitcherProps {
  year: number;
  zoomMonth: number | null;
  onStepYear: (direction: 1 | -1) => void;
  onZoomOut: () => void;
}

export function YearSwitcher({ year, zoomMonth, onStepYear, onZoomOut }: YearSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <Button variant="ghost" icon aria-label="Previous year" onClick={() => onStepYear(-1)}>
          &larr;
        </Button>
        <span className="min-w-[4ch] text-center font-mono text-figure tracking-title tabular-nums">
          {year}
        </span>
        <Button variant="ghost" icon aria-label="Next year" onClick={() => onStepYear(1)}>
          &rarr;
        </Button>
      </div>

      <div className="flex min-h-[34px] items-center">
        {zoomMonth === null ? (
          <span className="text-base text-ash">Click a month to open it</span>
        ) : (
          <Button variant="ghost" onClick={onZoomOut}>
            {MONTH_NAMES[zoomMonth]} &mdash; back to the year
          </Button>
        )}
      </div>
    </div>
  );
}
