/** Every tool the site hosts. The tab bar and the placeholder pages both read this. */
export interface Tool {
  /** Route segment under the (tools) group; also the tab's href. */
  href: string;
  /** Tab label — kept short so the bar stays on one line. */
  name: string;
  /** Shown on the tool's own page, under its title. */
  blurb: string;
}

export const TOOLS: Tool[] = [
  {
    href: "/mortgage",
    name: "Mortgage payoff",
    blurb: "What extra principal payments buy on a mortgage.",
  },
  {
    href: "/expenses",
    name: "Monthly expenses",
    blurb: "Where the money goes each month, and what changing one line does to the rest.",
  },
  {
    href: "/income",
    name: "Annual income",
    blurb: "Every payday of the year on one line, and what each month adds up to.",
  },
  {
    href: "/retirement",
    name: "Retirement",
    blurb: "Contributions, growth, and how long the balance lasts.",
  },
];
