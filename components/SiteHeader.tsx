"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HOME_HREF, TOOLS } from "@/lib/tools";
import { useSiteChrome } from "./SiteChrome";
import styles from "./SiteHeader.module.css";

/** Site title plus the tool switcher. Hidden while a tool takes over the screen. */
export function SiteHeader() {
  const pathname = usePathname();
  const { chromeVisible } = useSiteChrome();

  if (!chromeVisible) return null;

  return (
    <header className={styles.bar}>
      <Link href={HOME_HREF} className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.wordmark}>Ledger 1</span>
      </Link>

      <nav className={styles.tabs} aria-label="Tools">
        {TOOLS.map((tool) => {
          // The dashboard lives at "/", which every other path starts with, so
          // it only counts as active on an exact match.
          const active =
            tool.href === HOME_HREF
              ? pathname === HOME_HREF
              : pathname === tool.href || pathname.startsWith(`${tool.href}/`);

          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={styles.tab}
              aria-current={active ? "page" : undefined}
            >
              {tool.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
