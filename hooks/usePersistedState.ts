"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How long a burst of edits is given to settle before it reaches localStorage. */
const WRITE_DELAY_MS = 300;

export interface PersistedStateOptions {
  /**
   * Read the stored value but never write it back.
   *
   * For consumers that only display what another tool saved — the dashboard
   * widgets, and the cross-tool links. Without this every mounted reader
   * schedules a debounced `setItem` of a value it never changed, so merely
   * looking at a summary would rewrite the tool's entry.
   */
  readOnly?: boolean;
}

/**
 * State backed by localStorage. The first render always uses the initial value
 * so server and client markup agree; stored values are adopted after mount,
 * which is what `hydrated` reports.
 */
export function usePersistedState<T>(
  key: string,
  createInitial: () => T,
  options: PersistedStateOptions = {},
) {
  const readOnly = options.readOnly ?? false;
  const [value, setValue] = useState<T>(createInitial);
  const [hydrated, setHydrated] = useState(false);

  // What the debounce is holding, and the key it belongs to. In a ref rather
  // than read off `value`, so `flush` can stay a stable callback — it is handed
  // to an event listener that is registered once and has to keep working as the
  // value changes underneath it.
  const pending = useRef<{ key: string; value: T } | null>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Writes whatever the debounce is holding, now. A no-op when nothing is pending. */
  const flush = useCallback(() => {
    if (writeTimer.current) {
      clearTimeout(writeTimer.current);
      writeTimer.current = null;
    }
    const entry = pending.current;
    if (!entry) return;
    pending.current = null;
    try {
      window.localStorage.setItem(entry.key, JSON.stringify(entry.value));
    } catch {
      // Out of quota or private mode: the app still works, it just forgets.
    }
  }, []);

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
    if (!hydrated || readOnly) return;
    pending.current = { key, value };
    // Only ever one timer in flight: the previous one is cleared here rather
    // than in a cleanup, because a cleanup would also cancel the write when the
    // component goes away — which is exactly when it most needs to happen.
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(flush, WRITE_DELAY_MS);
  }, [key, value, hydrated, readOnly, flush]);

  /*
   * Ending the debounce early rather than cancelling it.
   *
   * Leaving a page used to drop whatever the last 300ms had changed — a short
   * edit could be lost in its entirety. That was nearly invisible while each
   * tool only ever read its own key, since coming back re-rendered from the
   * same state that was on screen. It stops being invisible once the tools read
   * each other: it is the difference between the expense list showing the
   * mortgage payment you just typed and showing the one before it.
   *
   * `pagehide` covers the tab being closed or navigated away from, where no
   * React cleanup runs at all. Should this app ever turn on Cache Components,
   * a route is hidden instead of unmounted — but effect cleanups still run when
   * it is hidden, so the flush happens there too.
   */
  useEffect(() => {
    if (readOnly) return;
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush, readOnly]);

  /*
   * Another tab writing this key.
   *
   * Only read-only consumers adopt it. A tool that owns its key has edits of
   * its own on screen and a write in flight; taking another tab's value would
   * overwrite what someone is in the middle of typing. A reader has nothing to
   * lose, and this is what keeps two open tabs from disagreeing about a figure
   * one of them just changed.
   */
  useEffect(() => {
    if (!readOnly) return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      try {
        setValue(event.newValue ? (JSON.parse(event.newValue) as T) : createInitial());
      } catch {
        // As with the first read: an unreadable entry leaves what we have.
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, readOnly, createInitial]);

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
