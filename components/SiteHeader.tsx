"use client";

import Link from "next/link";
import { HOME_HREF } from "@/lib/tools";
import { useSiteChrome } from "./SiteChrome";
import { ToolsMenu } from "./ToolsMenu";

/** Site title plus the tool switcher. Hidden while a tool takes over the screen. */
export function SiteHeader() {
  const { chromeVisible } = useSiteChrome();

  if (!chromeVisible) return null;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-[clamp(16px,3vw,48px)] border-b border-rule bg-ink/72 px-(--pad-bar) py-3.5 backdrop-blur-[10px]">
      <Link
        href={HOME_HREF}
        className="inline-flex flex-none items-center gap-2.5 text-bone no-underline"
      >
        <span className="size-2.5 rotate-45 rounded-[3px] bg-brass" aria-hidden="true" />
        <span className="font-display text-lg font-bold tracking-title">Ledger 1</span>
      </Link>

      <nav aria-label="Tools">
        <ToolsMenu />
      </nav>
    </header>
  );
}
