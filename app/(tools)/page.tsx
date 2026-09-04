import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { toolById } from "@/lib/tools";

// A server component wrapping the client dashboard, so the root route can
// export its own metadata. The (tools) group layout is shared by every tool
// and has no per-page slot for "/".
const tool = toolById("dashboard");

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

export default function Page() {
  return <Dashboard />;
}
