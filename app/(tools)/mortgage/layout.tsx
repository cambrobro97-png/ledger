import type { Metadata } from "next";
import { toolById } from "@/lib/tools";

// The page itself is a Client Component, so its metadata lives here.
const tool = toolById("mortgage");

export const metadata: Metadata = {
  title: tool.name,
  description: tool.blurb,
  openGraph: {
    title: `${tool.name} — Ledger 1`,
    description: tool.blurb,
    url: tool.href,
  },
  twitter: {
    card: "summary",
    title: `${tool.name} — Ledger 1`,
    description: tool.blurb,
  },
};

export default function MortgageLayout({ children }: LayoutProps<"/mortgage">) {
  return children;
}
