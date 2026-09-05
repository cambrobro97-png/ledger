"use client";

import Link from "next/link";
import { KOFI_URL, SPONSORS_URL, SUPPORT_ENABLED } from "@/lib/support";
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

      {SUPPORT_ENABLED && (
        <p className={styles.support}>
          {KOFI_URL && (
            <a
              className={styles.coffee}
              href={KOFI_URL}
              target="_blank"
              rel="noreferrer"
            >
              Buy me a coffee
            </a>
          )}
          <span className={styles.supportNote}>
            The tools are free and stay that way. A coffee helps cover the
            hosting.{" "}
            {SPONSORS_URL && (
              <>
                Developers can also{" "}
                <a
                  className={styles.link}
                  href={SPONSORS_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  sponsor the project on GitHub
                </a>
                .
              </>
            )}
          </span>
        </p>
      )}

      <p className={styles.copyright}>
        © {COPYRIGHT_YEAR} Ledger 1. All rights reserved.
      </p>
    </footer>
  );
}
