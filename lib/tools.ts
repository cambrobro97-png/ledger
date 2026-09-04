/** Every tool the site hosts. The tab bar and the placeholder pages both read this. */
export type ToolId = "dashboard" | "mortgage" | "expenses" | "income" | "retirement";

export interface Tool {
  /** Stable handle for the tool. Look tools up by this, never by position. */
  id: ToolId;
  /** Route segment under the (tools) group; also the tab's href. */
  href: string;
  /** Tab label — kept short so the bar stays on one line. */
  name: string;
  /** Shown on the tool's own page, under its title. */
  blurb: string;
}

export const TOOLS: Tool[] = [
  {
    id: "dashboard",
    href: "/",
    name: "Dashboard",
    blurb: "Everything at a glance, arranged the way you want it.",
  },
  {
    id: "mortgage",
    href: "/mortgage",
    name: "Mortgage payoff",
    blurb: "What extra principal payments buy on a mortgage.",
  },
  {
    id: "expenses",
    href: "/expenses",
    name: "Expenses",
    blurb: "Every bill of the year on one line, and what each month really costs.",
  },
  {
    id: "income",
    href: "/income",
    name: "Income",
    blurb: "Every payday of the year on one line, and what each month adds up to.",
  },
  {
    id: "retirement",
    href: "/retirement",
    name: "Retirement",
    blurb: "Contributions, growth, and how long the balance lasts.",
  },
];

/**
 * The tool with this id.
 *
 * Layouts used to index `TOOLS` positionally, which meant inserting a tool
 * silently handed every page after it the wrong title — a bug no type checker
 * would catch. Looking up by id costs nothing and makes that class of mistake
 * a build-time throw instead.
 */
export function toolById(id: ToolId): Tool {
  const tool = TOOLS.find((candidate) => candidate.id === id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
}

/** Where the brand mark points, and the site's root. */
export const HOME_HREF = "/";
