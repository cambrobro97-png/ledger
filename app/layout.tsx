import type { Metadata } from "next";
import "./globals.css";

const SITE_NAME = "Ledger";
const SITE_DESCRIPTION =
  "A small set of tools for thinking about money — mortgage payoff, income, expenses, and retirement, all worked out in the browser.";

/**
 * The deployed origin, needed to turn the relative icon and Open Graph paths
 * into the absolute URLs those tags require. Deploys are static, so the URL is
 * a constant rather than something read from the environment at request time.
 */
const SITE_URL = "https://d3pi3fnl3m6mh.cloudfront.net";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — tools for thinking about money`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "mortgage payoff calculator",
    "extra principal payments",
    "PMI drop-off",
    "amortization",
    "income timeline",
    "retirement projection",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — tools for thinking about money`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — tools for thinking about money`,
    description: SITE_DESCRIPTION,
  },
  // Nothing here is a public destination worth indexing, and every figure on
  // the site is the visitor's own data held in their browser.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
