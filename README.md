# Ledger 1

A small set of tools for thinking about money — mortgage payoff, income, expenses, and
retirement — all worked out in the browser. Nothing is sent anywhere; every figure you
enter stays in `localStorage`.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For a production build:

```bash
npm run build
npm start
```

## The tools

### Mortgage payoff

Compares extra-principal payoff scenarios against the scheduled payment. Saved scenarios,
animated transitions between them, and a presentation mode that locks editing.

- **The loan panel** sets balance, rate, payment, and the month the balance is accurate as of.
  Those terms apply to every scenario, and the remaining term is derived from them.
- **Scenario tabs** swap the values, not the page. Charts and figures ease into their new
  positions rather than jumping.
- **Each scenario** takes an extra monthly amount, an annual amount with the month it lands in,
  and any number of one-time lump sums with their own dates.
- **Present** hides every input and disables editing. **Edit** brings them back.
- **Keyboard:** `P` toggles presentation, `Esc` leaves it, `<-` and `->` move between scenarios.

### Expenses

Every bill of the year on one line, and what each month really costs. Click a month to open
it and see the bills that make it up, grouped by line rather than listed per payment.

- **Recurring or one-time.** A repeating bill generates its own dates from a first payment;
  a one-off lands once. The editor keeps the two apart.
- **Fixed or variable** marks what a lean month can't go below, which is what the headline
  figures and the lighter timeline bars are measured against.
- **Categories** colour the timeline and drive the split of where the money goes.

### Income

Every payday of the year on one line, and what each month adds up to. Click a month to open
it and see the sources that make it up.

Both this and the expense timeline draw the year across the screen on desktop and down it on
mobile, sized to the viewport so the whole year is visible without scrolling; on a phone a
payment is reached by tapping it.

### Retirement

Contributions, growth, and how long the balance lasts across accounts and outlooks.

## Storage

Each tool persists to its own `localStorage` key: `mortgage-payoff:v1`, `expenses:v1`,
`income:v1`, and `retirement:v1`. Nothing leaves the browser, and the seed values are
placeholders meant to be replaced with your own.

## Layout

```
app/
  layout.tsx            Document shell, web fonts, site metadata
  globals.css           Design tokens: colour, type, spacing
  (tools)/              One route per tool, sharing the tab bar
lib/
  types.ts              Loan, Scenario, Amortization, Comparison
  amortization.ts       The simulation, the baseline comparison, series padding
  schedule.ts           Cadences expanded into dated occurrences, shared by the two lists
  income.ts             The income year derived from those occurrences
  expenses.ts           The expense year, plus categories and the fixed/variable split
  retirement.ts         Contribution and drawdown projection
  dates.ts / days.ts    YYYY-MM parsing and calendar arithmetic
  format.ts             Currency, percentage, and duration formatting
  describe.ts           Plain-language summary of a scenario's contributions
  defaults.ts           Seed data and storage keys
  tools.ts              The tool registry the tab bar reads
hooks/
  useMortgageModel.ts   Mortgage state plus every derived projection
  useIncomeModel.ts     Income state and the year's occurrences
  useExpenseModel.ts    Expense state and the year's occurrences
  useRetirementModel.ts Retirement state and its projections
  usePersistedState.ts  localStorage-backed state, hydration-safe
  useClockDefaults.ts   Applies the real clock after mount
  useTween.ts           Eases numbers and series toward new targets
  useReducedMotion.ts   Honours the OS motion setting
  useMediaQuery.ts      Tracks a media query; picks the timeline's orientation
  useKeyboardControls.ts
components/
  Shared chrome, the mortgage view, and expenses/, income/, retirement/ subtrees
  timeline/             The shared year timeline: one engine, a horizontal
                        (desktop) and a vertical (mobile) renderer, the month
                        detail, the year switcher, and the payment card
  charts/               Plot geometry, frames, hover, and each chart
  ui/                   Field, Button, Panel
```

## Where the numbers come from

`lib/amortization.ts` steps the loan forward one payment at a time. Each month it charges
interest on the balance, applies the scheduled payment, then applies any extra principal,
capped so a lump sum can never overshoot the payoff. Scenarios are always measured against
`BASELINE_SCENARIO` &mdash; the scheduled payment and nothing more.

Charts pin their x-axis to the baseline term and pad shorter scenarios out to that length,
which is what lets the lines interpolate smoothly instead of rescaling on every switch.

## Deploying

Pushing to a branch deploys it:

| Branch | Site |
| --- | --- |
| `dev` | <https://dev.ledger-1.com> |
| `main` | <https://ledger-1.com> (`www` redirects here) |

`.github/workflows/deploy.yml` builds the export, syncs it to that environment's S3
bucket, and invalidates CloudFront. It authenticates with a short-lived OIDC token
rather than stored keys, and the role it assumes is pinned to a single branch, so a
run on `dev` cannot touch production.

Because the export bakes its own origin in at build time (`NEXT_PUBLIC_SITE_URL`),
each branch builds its own artifact. A build made for dev can't be promoted to
production &mdash; it would carry dev URLs in its metadata.

### The infrastructure

`cdk/` defines both environments: a private bucket, a CloudFront distribution, an ACM
certificate, and the deploy role. Deploy one with

```bash
cd cdk
npx cdk deploy --all --context stage=dev    # or stage=prod
```

`ledger-1.com` is registered at Squarespace but its DNS is hosted in Route 53, in a
zone deployed separately (`--context stage=dns`) so that neither environment owns a
resource the other depends on.

### By hand

`./deploy.sh` does the same build-and-sync from a laptop, for when CI isn't an option.
Copy `.env.deploy.example` to `.env.deploy` and fill in the bucket and distribution ID
(`.env.deploy` is gitignored), or pass them as environment variables.
