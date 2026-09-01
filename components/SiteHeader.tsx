"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOLS } from "@/lib/tools";
import { useSiteChrome } from "./SiteChrome";
import styles from "./SiteHeader.module.css";

/** Site title plus the tool switcher. Hidden while a tool takes over the screen. */
export function SiteHeader() {
  const pathname = usePathname();
  const { chromeVisible } = useSiteChrome();

  if (!chromeVisible) return null;

  return (
    <header className={styles.bar}>
      <Link href={TOOLS[0].href} className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.wordmark}>Ledger</span>
      </Link>

      <nav className={styles.tabs} aria-label="Tools">
        {TOOLS.map((tool) => {
          const active = pathname === tool.href || pathname.startsWith(`${tool.href}/`);

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
