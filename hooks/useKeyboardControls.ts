"use client";

import { useEffect } from "react";

interface Options {
  presenting: boolean;
  onTogglePresent: () => void;
  onExitPresent: () => void;
  onStep: (direction: 1 | -1) => void;
}

const EDITABLE = /^(INPUT|SELECT|TEXTAREA)$/;

/** P presents, Escape leaves, arrow keys move between scenarios. */
export function useKeyboardControls({
  presenting,
  onTogglePresent,
  onExitPresent,
  onStep,
}: Options) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && presenting) {
        onExitPresent();
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && EDITABLE.test(target.tagName)) return;

      if (event.key === "p" || event.key === "P") {
        onTogglePresent();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onStep(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onStep(-1);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [presenting, onTogglePresent, onExitPresent, onStep]);
}
