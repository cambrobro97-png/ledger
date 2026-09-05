"use client";

import Link from "next/link";
import { HOME_HREF } from "@/lib/tools";
import { useSiteChrome } from "./SiteChrome";
import { ToolsMenu } from "./ToolsMenu";
import styles from "./SiteHeader.module.css";

/** Site title plus the tool switcher. Hidden while a tool takes over the screen. */
export function SiteHeader() {
  const { chromeVisible } = useSiteChrome();

  if (!chromeVisible) return null;

  return (
    <header className={styles.bar}>
      <Link href={HOME_HREF} className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.wordmark}>Ledger 1</span>
      </Link>

      <nav aria-label="Tools">
        <ToolsMenu />
      </nav>
    </header>
  );
}
