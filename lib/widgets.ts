import type { ComponentType } from "react";
import { CashFlowWidget } from "@/components/dashboard/widgets/CashFlowWidget";
import { ExpensesYearWidget } from "@/components/dashboard/widgets/ExpensesYearWidget";
import { IncomeYearWidget } from "@/components/dashboard/widgets/IncomeYearWidget";
import { MortgagePayoffWidget } from "@/components/dashboard/widgets/MortgagePayoffWidget";
import { RetirementAgeWidget } from "@/components/dashboard/widgets/RetirementAgeWidget";
import type { WidgetSize } from "./dashboardLayout";
import type { ToolId } from "./tools";

/** What every widget component is handed — nothing else. */
export interface WidgetProps {
  /**
   * The size to render at, already resolved for the viewport. A phone gives
   * every widget the full column, so this arrives as "small" there whatever
   * the user picked.
   */
  size: WidgetSize;
}

export interface WidgetDefinition {
  /** Stable forever: this lands in localStorage. Never rename one. */
  id: string;
  /** Shown in the widget's own header and in the catalog. */
  title: string;
  /** One line in the catalog, saying what the number means. */
  blurb: string;
  /** The tool this reads, or "cross" when it reads more than one. */
  owner: ToolId | "cross";
  /** Where the card links. */
  href: string;
  /** Sizes this renders well at, in the order the size button cycles them. */
  sizes: WidgetSize[];
  /** Must be a member of `sizes`. */
  defaultSize: WidgetSize;
  /** Whether a fresh browser opens with this on the board. */
  inDefaultLayout: boolean;
  Component: ComponentType<WidgetProps>;
}

/**
 * Every widget the dashboard can show.
 *
 * Adding one is a new component plus one entry here — that is the whole
 * extension story, and the reason the definition holds its component directly
 * rather than sitting behind a separate id-to-component map.
 */
export const WIDGETS: WidgetDefinition[] = [
  {
    id: "mortgage-payoff",
    title: "Payoff",
    blurb: "How long the mortgage has left on the scenario you picked.",
    owner: "mortgage",
    href: "/mortgage",
    sizes: ["small", "medium", "wide"],
    defaultSize: "medium",
    inDefaultLayout: true,
    Component: MortgagePayoffWidget,
  },
  {
    id: "expenses-year",
    title: "Spending",
    blurb: "What the year's bills come to, and what that is a month.",
    owner: "expenses",
    href: "/expenses",
    sizes: ["small", "medium", "wide"],
    defaultSize: "small",
    inDefaultLayout: true,
    Component: ExpensesYearWidget,
  },
  {
    id: "income-year",
    title: "Gross income",
    blurb: "What the year's paydays add up to.",
    owner: "income",
    href: "/income",
    sizes: ["small", "medium", "wide"],
    defaultSize: "small",
    inDefaultLayout: true,
    Component: IncomeYearWidget,
  },
  {
    id: "retirement-age",
    title: "Stop working at",
    blurb: "The earliest age the money still lasts on the current outlook.",
    owner: "retirement",
    href: "/retirement",
    sizes: ["small", "medium", "wide"],
    defaultSize: "small",
    inDefaultLayout: true,
    Component: RetirementAgeWidget,
  },
  {
    id: "cash-flow",
    title: "Cash flow",
    blurb: "Income against spending — what is left over across the year.",
    owner: "cross",
    href: "/expenses",
    sizes: ["small", "medium", "wide"],
    defaultSize: "wide",
    inDefaultLayout: true,
    Component: CashFlowWidget,
  },
];

const BY_ID = new Map(WIDGETS.map((widget) => [widget.id, widget]));

export function widgetById(id: string): WidgetDefinition | undefined {
  return BY_ID.get(id);
}

export const DEFAULT_WIDGET_IDS: string[] = WIDGETS.filter(
  (widget) => widget.inDefaultLayout,
).map((widget) => widget.id);
