"use client";

import Link from "next/link";
import { KOFI_URL, SPONSORS_URL, SUPPORT_ENABLED } from "@/lib/support";
import { HOME_HREF } from "@/lib/tools";
import { useSiteChrome } from "./SiteChrome";

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
    <footer className="mt-auto grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-[clamp(20px,3vw,56px)] gap-y-3.5 border-t border-rule bg-panel px-(--pad-bar) py-[clamp(24px,2.6vw,36px)] max-xs:grid-cols-[minmax(0,1fr)]">
      <Link href={HOME_HREF} className="inline-flex items-center gap-2.5 text-bone no-underline">
        <span className="size-2.5 rotate-45 rounded-[3px] bg-brass" aria-hidden="true" />
        <span className="font-display text-lg font-bold tracking-title">Ledger 1</span>
      </Link>

      <p className="m-0 max-w-[92ch] text-sm leading-[1.55] text-ash">
        Ledger 1 is an arithmetic tool, not financial advice. Every figure here is an estimate
        worked out from the numbers you enter, and it makes no assumptions about your circumstances.
        Talk to a qualified financial, tax, or legal professional before acting on anything you see
        here.
      </p>

      <p className="col-start-2 m-0 max-w-[92ch] text-sm leading-[1.55] text-ash max-xs:col-start-1">
        Ledger 1 is open source under the MIT License. Read the code, report a bug, or send a pull
        request on{" "}
        <a
          className="text-bone underline decoration-rule underline-offset-[3px] transition-colors duration-[180ms] hover:text-brass hover:decoration-brass"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        .
      </p>

      {SUPPORT_ENABLED && (
        <p className="col-start-2 m-0 flex flex-wrap items-center gap-2.5 max-xs:col-start-1">
          {KOFI_URL && (
            <a
              className="flex-none rounded-full border border-brass bg-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap text-brass no-underline transition-colors duration-[180ms] hover:bg-brass hover:text-ink"
              href={KOFI_URL}
              target="_blank"
              rel="noreferrer"
            >
              Buy me a coffee
            </a>
          )}
          <span className="max-w-[92ch] text-sm leading-[1.55] text-ash">
            The tools are free and stay that way. A coffee helps cover the hosting.
            {SPONSORS_URL && (
              <>
                {" "}
                Developers can also{" "}
                <a
                  className="text-bone underline decoration-rule underline-offset-[3px] transition-colors duration-[180ms] hover:text-brass hover:decoration-brass"
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

      <p className="col-start-2 m-0 pt-0.5 font-mono text-sm text-ash max-xs:col-start-1">
        © {COPYRIGHT_YEAR} Ledger 1. All rights reserved.
      </p>
    </footer>
  );
}
