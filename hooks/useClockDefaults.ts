"use client";

import { useEffect, useRef } from "react";

/**
 * Moves seed data from its fixed `SEED_MONTH` onto the real clock, once, after
 * mount.
 *
 * The defaults in `lib/defaults.ts` are deliberately clock-free so the server's
 * markup and the client's first pass agree — see `SEED_MONTH`. That correctness
 * comes at the cost of opening on a stale month, which this puts back in the one
 * place a clock read is safe: an effect, which never runs on the server and so
 * can't contribute to the hydration diff.
 *
 * `shouldApply` decides whether the stored state is still untouched seed data.
 * Anything the user has edited, or anything restored from localStorage, is left
 * exactly as it is — this only ever advances defaults nobody has looked at yet.
 */
export function useClockDefaults<T>(
  hydrated: boolean,
  setValue: (update: (prev: T) => T) => void,
  shouldApply: (state: T) => boolean,
  apply: (state: T) => T,
) {
  // The clock is applied at most once per mount. Without this, `apply` running
  // on its own output would walk the seed data forward on every render.
  const applied = useRef(false);

  useEffect(() => {
    // Waiting for `hydrated` matters: before it, `setValue` would race the
    // localStorage read and could clobber real stored state with seed data.
    if (!hydrated || applied.current) return;
    applied.current = true;
    setValue((prev) => (shouldApply(prev) ? apply(prev) : prev));
  }, [hydrated, setValue, shouldApply, apply]);
}
