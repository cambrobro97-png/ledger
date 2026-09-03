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

      {/* The Edit / Present toggle is hidden while presentation mode is being
          reworked; Esc still leaves a session started from the keyboard. */}
      {presenting ? (
        <Button variant="ghost" className={styles.exit} onClick={() => onModeChange(false)}>
          Exit presentation <kbd>Esc</kbd>
        </Button>
      ) : null}
    </header>
  );
}
