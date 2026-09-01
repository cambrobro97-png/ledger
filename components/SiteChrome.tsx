"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface ChromeState {
  /** False while a tool wants the site chrome out of the way (e.g. presenting). */
  chromeVisible: boolean;
  setChromeVisible: (visible: boolean) => void;
}

const ChromeContext = createContext<ChromeState | null>(null);

export function SiteChromeProvider({ children }: { children: React.ReactNode }) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const value = useMemo(() => ({ chromeVisible, setChromeVisible }), [chromeVisible]);

  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

/**
 * Read/write the site chrome's visibility. Returns a no-op setter outside the
 * provider so a tool rendered on its own doesn't have to care.
 */
export function useSiteChrome(): ChromeState {
  return useContext(ChromeContext) ?? { chromeVisible: true, setChromeVisible: () => {} };
}
