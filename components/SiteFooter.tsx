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

const REPO_URL = "https://github.com/cambrobro97-png/ledger";

/**
 * The Buy Me a Coffee page to send supporters to. A plain outbound link on
 * purpose: the platform's embed widget is a third-party script that would run
 * on every page of a tool that holds the visitor's balances in `localStorage`,
 * and its floating button is appended to `document.body` outside React, so it
 * would sit over the charts in presentation mode where the rest of the chrome
 * steps aside. A link sends nothing until it is clicked, and swapping to Ko-fi
 * or GitHub Sponsors later is this one string.
 *
 * Set to the real page before merging; the note stays hidden while it holds
 * the placeholder, so a half-finished link can never reach production.
 */
const SUPPORT_URL = "https://buymeacoffee.com/YOUR_HANDLE";
const SUPPORT_CONFIGURED = !SUPPORT_URL.includes("YOUR_HANDLE");

/**
 * Closes out every tool page: the brand mark, the "not advice" disclosure, the
 * open-source note, the support link, and the copyright. Like the header, it
 * steps aside when a tool takes over the screen.
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

      <p className={styles.source}>
        Ledger 1 is open source under the MIT License. Read the code, report a bug,
        or send a pull request on{" "}
        <a
          className={styles.link}
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        .
      </p>

      {SUPPORT_CONFIGURED && (
        <p className={styles.support}>
          <a
            className={styles.coffee}
            href={SUPPORT_URL}
            target="_blank"
            rel="noreferrer"
          >
            Buy me a coffee
          </a>
          <span className={styles.supportNote}>
            The tools are free and stay that way. A coffee helps cover the
            hosting.
          </span>
        </p>
      )}

      <p className={styles.copyright}>
        © {COPYRIGHT_YEAR} Ledger 1. All rights reserved.
      </p>
    </footer>
  );
}
