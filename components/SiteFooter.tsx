"use client";

import Link from "next/link";
import { HOME_HREF } from "@/lib/tools";
import { useSiteChrome } from "./SiteChrome";
import styles from "./SiteFooter.module.css";

/**
 * Fixed at build time on purpose. The site is a static export, so calling
 * `getFullYear()` during render would prerender the build's year and then
 * hydrate the visitor's — a mismatch every New Year until the next deploy.
 * The year moves when the site is rebuilt, which is when the copyright
 * genuinely changes.
 */
const COPYRIGHT_YEAR = new Date().getFullYear();

/**
 * Closes out every tool page: the brand mark, the "not advice" disclosure, and
 * the copyright. Like the header, it steps aside when a tool takes over the
 * screen.
 */
export function SiteFooter() {
  const { chromeVisible } = useSiteChrome();

  if (!chromeVisible) return null;

  return (
    <footer className={styles.bar}>
      <Link href={HOME_HREF} className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.wordmark}>Ledger 1</span>
      </Link>

      <p className={styles.disclosure}>
        Ledger 1 is an arithmetic tool, not financial advice. Every figure here is an
        estimate worked out from the numbers you enter, and it makes no assumptions
        about your circumstances. Talk to a qualified financial, tax, or legal
        professional before acting on anything you see here.
      </p>

      <p className={styles.copyright}>
        © {COPYRIGHT_YEAR} Ledger 1. All rights reserved.
      </p>
    </footer>
  );
}
