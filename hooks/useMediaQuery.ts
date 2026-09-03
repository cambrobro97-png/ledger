"use client";

import { useEffect, useState } from "react";

/**
 * Tracks a media query. Starts `false` so the server and the first client
 * render agree — the real value arrives in the effect, which is what keeps a
 * static export free of hydration mismatches. A phone therefore renders the
 * desktop branch for one frame and swaps on hydrate; that's the deliberate
 * cost of matching the server, not a bug to "fix" into a synchronous read.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", listener);
    return () => list.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
