"use client";

import { cn } from "@/lib/cn";
import { useExpenseSummary } from "@/hooks/summaries/useExpenseSummary";
import { useIncomeSummary } from "@/hooks/summaries/useIncomeSummary";
import { useRetirementSummary } from "@/hooks/summaries/useRetirementSummary";
import type { WidgetProps } from "@/lib/widgets";
import { WidgetShell } from "../WidgetShell";

interface Connection {
  from: string;
  what: string;
  /** Worth a second look — a mismatch rather than a link. */
  caution?: boolean;
}

/**
 * What is wired to what.
 *
 * Links are quiet by design: a figure taken from another tool looks exactly
 * like one that was typed. That is right on the page, where the row says where
 * it came from — but it leaves no way to ask "what is actually connected?"
 * without opening all four tools. This is that question, answered in one card.
 */
export function ConnectionsWidget({ size }: WidgetProps) {
  const expenses = useExpenseSummary();
  const income = useIncomeSummary();
  const retirement = useRetirementSummary();

  const hydrated = expenses.hydrated && income.hydrated && retirement.hydrated;
  const connections: Connection[] = [];

  const mortgageLines = expenses.items.filter((item) => item.link?.source === "mortgage").length;
  if (mortgageLines > 0) {
    connections.push({
      from: "Mortgage → Expenses",
      what: `${mortgageLines} ${mortgageLines === 1 ? "line" : "lines"} on the timeline`,
    });
  }

  const contributionLines = expenses.items.filter(
    (item) => item.link?.source === "retirement",
  ).length;
  if (contributionLines > 0) {
    connections.push({
      from: "Retirement → Expenses",
      what: `contributions on ${contributionLines} ${contributionLines === 1 ? "line" : "lines"}`,
    });
  }

  const profile = retirement.profile;
  if (profile.mortgageLink) {
    connections.push({ from: "Mortgage → Retirement", what: "the payment and payoff month" });
  }
  if (profile.salaryLink) {
    connections.push({ from: "Income → Retirement", what: "the salary the match is sized on" });
  }
  if (profile.redirect?.enabled) {
    connections.push({ from: "Payoff → Savings", what: `${profile.redirect.share}% of the payment` });
  }

  const linkedOutlooks = retirement.scenariosWithSpendLink;
  if (linkedOutlooks > 0) {
    connections.push({
      from: "Expenses → Retirement",
      what: `spending on ${linkedOutlooks} ${linkedOutlooks === 1 ? "outlook" : "outlooks"}`,
    });
  }

  /*
   * The one mismatch worth reporting. Everything else here is annualised and so
   * doesn't care what year each tool sits on, but the cash-flow cards compare
   * the two lists year against year — and quietly show different ones.
   */
  if (income.year !== expenses.year) {
    connections.push({
      from: "Income vs Expenses",
      what: `showing ${income.year} against ${expenses.year}`,
      caution: true,
    });
  }

  const live = connections.filter((connection) => !connection.caution).length;

  return (
    <WidgetShell
      eyebrow="Across the tools"
      title="Connections"
      value={String(live)}
      detail={live === 1 ? "figure taken from another tool" : "figures taken from other tools"}
      accent={live > 0 ? "var(--jade)" : "var(--ash)"}
      hydrated={hydrated}
    >
      {size === "small" ? null : connections.length === 0 ? (
        <p className="text-sm leading-[1.5] text-ash">
          Nothing is linked yet. A mortgage scenario can go on the expense timeline, and an
          outlook&rsquo;s spending can come from the expense list.
        </p>
      ) : (
        <div className="mt-0.5 grid gap-1.5">
          {connections.map((connection) => (
            <div
              key={connection.from}
              className={cn(
            "flex items-baseline gap-2 text-sm",
            connection.caution ? "text-brass" : "text-ash",
          )}
            >
              <span className="whitespace-nowrap font-mono text-micro uppercase tracking-[0.06em] text-bone">{connection.from}</span>
              <span className="min-w-0 truncate">{connection.what}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
