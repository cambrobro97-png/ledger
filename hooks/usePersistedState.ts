"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State backed by localStorage. The first render always uses the initial value
 * so server and client markup agree; stored values are adopted after mount,
 * which is what `hydrated` reports.
 */
export function usePersistedState<T>(key: string, createInitial: () => T) {
  const [value, setValue] = useState<T>(createInitial);
  const [hydrated, setHydrated] = useState(false);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch {
      // A corrupt or unreadable entry just means we keep the defaults.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Out of quota or private mode: the app still works, it just forgets.
      }
    }, 300);
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [key, value, hydrated]);

  const reset = useCallback(() => {
    setValue(createInitial());
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing to clean up.
    }
  }, [createInitial, key]);

  return { value, setValue, reset, hydrated };
}
