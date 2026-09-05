"use client";

import { useRetirementSummary } from "@/hooks/summaries/useRetirementSummary";
import { formatMoney } from "@/lib/format";
import type { WidgetProps } from "@/lib/widgets";
import { GapChart } from "../GapChart";
import { WidgetShell } from "../WidgetShell";

/**
 * The age a safe withdrawal first covers what a year costs to live.
 *
 * The retirement widget answers when the money lasts; this answers when it
 * starts carrying you, which lands earlier and is the moment work becomes a
 * choice.
 */
export function RetirementCrossoverWidget({ size }: WidgetProps) {
  const { hydrated, outlookName, currentAge, current } = useRetirementSummary();

  const draw = current?.sustainableDrawByYear ?? [];
  const spend = current?.spendingByYear ?? [];
  const horizon = Math.min(draw.length, spend.length);

  let crossing = -1;
  for (let year = 0; year < horizon; year += 1) {
    if (draw[year] >= spend[year]) {
      crossing = year;
      break;
    }
  }

  const crossed = crossing !== -1;

  /*
   * The chart stops a few years past the crossing rather than running to the
   * end of the plan.
   *
   * A portfolio left to compound for another thirty years ends up an order of
   * magnitude above the point where the two lines meet, and on one linear scale
   * that pins the crossing — the entire subject of the card — flat against the
   * floor. The tail is the retirement widget's story; this one keeps the years
   * either side of the moment it is naming, with enough daylight after it to
   * show the lines genuinely separating.
   */
  const visibleYears = crossed
    ? Math.min(horizon, crossing + Math.max(5, Math.ceil(crossing * 0.4)) + 1)
    : horizon;

  return (
    <WidgetShell
      eyebrow={outlookName ? `Retirement · ${outlookName}` : "Retirement"}
      title="Work optional at"
      value={crossed ? String(currentAge + crossing) : "—"}
      detail={
        !current
          ? "Check the retirement figures"
          : crossed
            ? `A 4% draw covers the ${formatMoney(spend[crossing])} that year costs`
            : "The safe draw never catches spending on this outlook"
      }
      accent="var(--jade)"
      hydrated={hydrated}
    >
      {size !== "small" && horizon > 1 ? (
        <GapChart
          // Which line is on top swaps at the crossing, so only the far side is
          // shaded — the near side would colour in the shortfall as if it were
          // the surplus.
          upper={{ values: draw.slice(0, visibleYears), color: "var(--jade)" }}
          lower={{ values: spend.slice(0, visibleYears), color: "var(--crimson)" }}
          fillFrom={crossed ? crossing : undefined}
          fillColor="var(--jade)"
          marker={crossed ? crossing : undefined}
          label="What the portfolio could safely pay out each year against what living costs, through the years around the one they cross"
        />
      ) : null}
    </WidgetShell>
  );
}
