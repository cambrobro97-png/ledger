"use client";

import { Button } from "@/components/ui/Button";
import { MONTH_NAMES } from "@/lib/dates";
import styles from "./YearSwitcher.module.css";

interface YearSwitcherProps {
  year: number;
  zoomMonth: number | null;
  onStepYear: (direction: 1 | -1) => void;
  onZoomOut: () => void;
}

export function YearSwitcher({ year, zoomMonth, onStepYear, onZoomOut }: YearSwitcherProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.years}>
        <Button variant="ghost" icon aria-label="Previous year" onClick={() => onStepYear(-1)}>
          &larr;
        </Button>
        <span className={styles.year}>{year}</span>
        <Button variant="ghost" icon aria-label="Next year" onClick={() => onStepYear(1)}>
          &rarr;
        </Button>
      </div>

      <div className={styles.zoom}>
        {zoomMonth === null ? (
          <span className={styles.hint}>Click a month to open it</span>
        ) : (
          <Button variant="ghost" onClick={onZoomOut}>
            {MONTH_NAMES[zoomMonth]} &mdash; back to the year
          </Button>
        )}
      </div>
    </div>
  );
}
