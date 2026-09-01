import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/ToolPlaceholder";
import { TOOLS } from "@/lib/tools";

const tool = TOOLS[1];

export const metadata: Metadata = {
  title: tool.name,
  description: tool.blurb,
  openGraph: {
    title: `${tool.name} — Ledger`,
    description: tool.blurb,
    url: tool.href,
  },
  twitter: {
    card: "summary",
    title: `${tool.name} — Ledger`,
    description: tool.blurb,
  },
};

export default function Page() {
  return <ToolPlaceholder tool={tool} />;
}
