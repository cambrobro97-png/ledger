# Paying it down early

An interactive presentation for comparing extra-principal payoff scenarios on a mortgage.
Saved scenarios, animated transitions between them, and a presentation mode that locks editing.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For the version you actually present from:

```bash
npm run build
npm start
```

## Using it

- **The loan panel** sets balance, rate, payment, and the month the balance is accurate as of.
  Those terms apply to every scenario, and the remaining term is derived from them.
- **Scenario tabs** swap the values, not the page. Charts and figures ease into their new
  positions rather than jumping.
- **Each scenario** takes an extra monthly amount, an annual amount with the month it lands in,
  and any number of one-time lump sums with their own dates.
- **Present** hides every input and disables editing. **Edit** brings them back.
- **Keyboard:** `P` toggles presentation, `Esc` leaves it, `<-` and `->` move between scenarios.

Everything is stored in `localStorage` under `mortgage-payoff:v1`. Nothing leaves the browser.

## Layout

```
app/
  layout.tsx            Document shell and web fonts
  page.tsx              Composes the whole view, owns presentation mode
  globals.css           Design tokens: colour, type, spacing
lib/
  types.ts              Loan, Scenario, Amortization, Comparison
  amortization.ts       The simulation, the baseline comparison, series padding
  dates.ts              YYYY-MM parsing and calendar-month arithmetic
  format.ts             Currency, percentage, and duration formatting
  describe.ts           Plain-language summary of a scenario's contributions
  defaults.ts           Seed loan and starting scenarios
hooks/
  useMortgageModel.ts   All state plus every derived projection
  usePersistedState.ts  localStorage-backed state, hydration-safe
  useTween.ts           Eases numbers and series toward new targets
  useReducedMotion.ts   Honours the OS motion setting
  useKeyboardControls.ts
components/
  TopBar, LoanPanel, ScenarioTabs, Hero, TermRibbon
  MetricStrip, MetricCard
  ScenarioEditor, ScenarioCard, OneTimeRow
  charts/
    geometry.ts         Plot boxes, scales, SVG path builders
    ChartFrame.tsx      Gridlines, axis labels, payoff marker
    ChartCard.tsx       Heading, hover readout, legend
    useChartHover.ts    Pointer position to series index
    BalanceChart, InterestChart, YearSplitChart
  ui/
    Field, Button, Panel
```

## Where the numbers come from

`lib/amortization.ts` steps the loan forward one payment at a time. Each month it charges
interest on the balance, applies the scheduled payment, then applies any extra principal,
capped so a lump sum can never overshoot the payoff. Scenarios are always measured against
`BASELINE_SCENARIO` &mdash; the scheduled payment and nothing more.

Charts pin their x-axis to the baseline term and pad shorter scenarios out to that length,
which is what lets the lines interpolate smoothly instead of rescaling on every switch.
