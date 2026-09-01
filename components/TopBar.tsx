"use client";

import { Button } from "./ui/Button";
import styles from "./TopBar.module.css";

interface TopBarProps {
  presenting: boolean;
  onModeChange: (presenting: boolean) => void;
}

export function TopBar({ presenting, onModeChange }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div>
        <div className={styles.eyebrow}>Extra principal &mdash; what it actually buys</div>
        <h1 className={styles.title}>Paying it down early</h1>
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
