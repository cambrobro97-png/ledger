"use client";

import { Button } from "../ui/Button";
import styles from "../TopBar.module.css";

interface RetirementTopBarProps {
  presenting: boolean;
  onModeChange: (presenting: boolean) => void;
}

export function RetirementTopBar({ presenting, onModeChange }: RetirementTopBarProps) {
  return (
    <header className={styles.bar}>
      <div>
        <div className={styles.eyebrow}>Contributions and growth &mdash; when they add up</div>
        <h1 className={styles.title}>The year work becomes optional</h1>
      </div>

      {presenting ? (
        <Button variant="ghost" className={styles.exit} onClick={() => onModeChange(false)}>
          Exit presentation <kbd>Esc</kbd>
        </Button>
      ) : (
        <div className={styles.modes} role="group" aria-label="View mode">
          <button
            type="button"
            className={styles.mode}
            aria-pressed={!presenting}
            onClick={() => onModeChange(false)}
          >
            Edit
          </button>
          <button
            type="button"
            className={styles.mode}
            aria-pressed={presenting}
            onClick={() => onModeChange(true)}
          >
            Present
          </button>
        </div>
      )}
    </header>
  );
}
