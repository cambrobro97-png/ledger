# Design tokens

The contract the Tailwind migration is built on. Phase 1 moves these into a
Tailwind `@theme` block, where they generate utilities *and* stay readable as
`var(--…)` from whatever CSS Modules remain. Phase 2 applies the type scale.

Nothing here is aspirational — every value is one already in the tree, chosen
from the cluster it sits in. Where a step replaces several near-identical
values, the drift is listed so it can be reviewed rather than discovered.

## Why a type scale is the first thing

Nine routes had accumulated **51 distinct `font-size` values**, and the clusters
are near-duplicates rather than distinct steps:

    clamp(11px, 0.85vw, 13px)   ×13
    clamp(11px, 0.80vw, 13px)   ×2
    clamp(11px, 0.78vw, 13px)   ×2
    clamp(11px, 0.82vw, 13px)   ×1

Nobody chose four sizes a hundredth of a viewport-width apart; each was typed
fresh because there was nothing to reach for. Twelve steps cover every use.

## Type scale

| Token | Value | Role, and what it replaces |
| --- | --- | --- |
| `--text-micro` | `clamp(9.5px, 0.65vw, 11px)` | Provenance lines. `ConnectionsWidget.from`, `AgeRibbon.payoffLabel`, `Dashboard.catalogOwner` |
| `--text-label` | `clamp(10px, 0.72vw, 12px)` | Mono metadata above a value. `MetricCard.key`, `WidgetShell.eyebrow`/`note`, `ExpenseItemRow.linkBadge`/`annual`, `MonthDetail.eyebrow`/`meta`/`share`, `ExpenseEditor.groupTitle`/`groupMeta`, `MortgageLinkPicker.title`, `ExpenseMetrics.categoriesHead`/`noteLabel` |
| `--text-eyebrow` | `clamp(10px, 0.72vw, 13px)` | The section eyebrow, already identical in 7 files: `Hero`, `LoanPanel`, `ToolPlaceholder`, `TopBar`, `ProfilePanel`, `RetirementHero`, `Panel` |
| `--text-sm` | `clamp(11px, 0.85vw, 13px)` | Notes and hints under a control. The 13-use cluster, its three near-twins, and the fixed `11.5px` / `12px` / `12.5px` small text |
| `--text-base` | `clamp(11.5px, 0.85vw, 14px)` | Supporting text with a job. `TermRibbon`/`AgeRibbon` `.labels` and `.cap`, `charts.readout`, `Dashboard.catalogHint`/`emptyHint`, `ExpenseMetrics.legendItem`, `WidgetShell.detail`, `YearSwitcher.hint` |
| `--text-body` | `clamp(13px, 0.95vw, 15px)` | Default reading size. `MonthDetail.name`, the `empty` states, `RedirectPanel.verdict`, `Field.affix`/`toggleLabel`, and the fixed `13px` / `14px` / `14.5px` body text |
| `--text-lg` | `clamp(14px, 1.05vw, 19px)` | Lead-in prose and wordmarks. `Hero.sub`, `RetirementHero.sub`, `ToolPlaceholder.blurb`, `SiteHeader.wordmark`, `SiteFooter.wordmark`, `WidgetShell.title`, `Field.select`, `ExpenseItemRow.derived`, and the card names (`ScenarioCard`, `AccountCard`, `OutlookCard`) |
| `--text-title` | `clamp(17px, 1.35vw, 25px)` | Panel and card headings. `Panel.title`, `Dashboard.catalogTitle`/`emptyTitle`, `LoanPanel.chipValue`, `ProfilePanel.chipValue`, `OccurrenceCard.amount`, `ExpenseMetrics.noteValue` |
| `--text-amount` | `clamp(18px, 1.55vw, 25px)` | A figure inside a card, smaller than the card's own headline. `OccurrenceCard.amount`, `ExpenseMetrics.noteValue` |
| `--text-figure` | `clamp(23px, 2.2vw, 38px)` | A number that is the point of its card. `WidgetShell.value`, `MonthDetail.total`, `YearSwitcher.year` |
| `--text-display` | `clamp(26px, 2.6vw, 48px)` | Page and metric headlines. `TopBar.title`, `MetricCard.value`, `ToolPlaceholder.title` |
| `--text-hero` | `clamp(30px, 4.4vw, 76px)` | The verdict, unchanged. `Hero.verdict`, `RetirementHero.verdict` |

### Drift this accepts

Collapsing near-twins moves some text by a pixel or two at some widths. All of
it is intentional; none of it changes which step a piece of text belongs to:

- The `13px`-max cluster loses its four slightly different slopes and takes the
  steepest, `0.85vw`. Below about 1294px every one of them is already pinned to
  the 11px floor, so nothing moves on a phone or a laptop; above it the shallow
  slopes catch up, by at most 1.0px at 1440px.
- Fixed `12px` and `12.5px` small text becomes fluid (`--text-sm`), so it now
  shrinks on a phone and grows slightly on a wide screen instead of sitting
  still. At 390px a footnote drops from 12.5px to 11px. This is the biggest
  deliberate change in the scale.
- `TopBar.title` grows about 2.9px at 1440px, joining `MetricCard.value` on
  `--text-display`. The two were a designed pair that had drifted apart.

### Where the scale is lossiest

The small end of this design was genuinely duplicated — four slopes for one
size — and collapses cleanly. The large end was not: above about 17px nearly
every value is used once, for one role, and merging those destroys a hierarchy
rather than removing a duplicate. The steps above `--text-lg` are therefore
deliberately close to the values they replace, and `--text-amount` exists
because folding two card figures into `--text-title` cost them 2.2px and 3.6px
at 1440px and flattened them against the panel headings.

Three assignments were wrong on the first pass and are worth recording, because
they are the failure mode to watch for in phases 3 to 5 — a step that is close
in size but wrong in role:

- The card names (`ScenarioCard`, `AccountCard`, `OutlookCard`) were put on
  `--text-body`, which put them at 13px on a phone against their own 11px note.
  A name has to outrank its note; `--text-lg` keeps the 1.25 ratio they had.
- The ribbon caps were put on `--text-body`, which *grew* them from 11px to 13px
  at 390px — in the one place on the page with least room. `--text-base` matches
  what they were to within half a pixel.
- `ToolPlaceholder.title` loses 8.6px at 1440px on `--text-display`. Left as is:
  `ToolPlaceholder` is imported by nothing, since every tool in the registry is
  built, so the component is unreachable.

### SVG text is not on this scale

Six of the 51 values sit on `<text>` inside an SVG `viewBox`, where `px` is a
*user unit* that scales with the chart, not a CSS pixel. Putting a `vw`-based
clamp on them would scale them twice and break at both ends. They stay literal,
in the two modules listed as permanent in the migration plan:

`charts.axisLabel` · `charts.markerLabel` · `TimelineChrome.bandLabel` ·
`TimelineChrome.railLabel` · `TimelineChrome.dayLabel` · `TimelineChrome.empty`

`MonthTicks.tick` reads like one of these and is not: its ticks are `<span>`s in
a flex row, not SVG text, so it takes `--text-micro` like any other label.

## Colour

Unchanged from `globals.css` — the names are already good and the values are
already used consistently. Phase 1 renames them to Tailwind's `--color-*`
convention so they generate `bg-*` / `text-*` / `border-*` utilities, and keeps
the short aliases so untouched modules keep working.

| Token | Value | Meaning |
| --- | --- | --- |
| `--color-ink` | `#0f1620` | Page ground |
| `--color-panel` | `#18212e` | Card surface |
| `--color-panel-2` | `#1e2937` | Raised surface, hover |
| `--color-rule` | `#273345` | Every border |
| `--color-bone` | `#edf1f6` | Text |
| `--color-ash` | `#8698ae` | Muted text — 81 uses, the most-repeated declaration in the tree |
| `--color-crimson` | `#e4525f` | Money lost |
| `--color-jade` | `#3ecfa0` | Money kept |
| `--color-brass` | `#e8b14c` | What a scenario claws back; also the focus ring |

`--accent` stays exactly as it is: set per-instance from JS
(`style={{ "--accent": … }}` in `MetricCard`, `WidgetShell`, `AccountCard`,
`ExpenseItemRow`, `IncomeItemRow`, `OccurrenceCard`, `MonthDetail`) and read as
`text-(--accent)`. Same for `--band` on the two timelines.

## Type families

| Token | Value |
| --- | --- |
| `--font-display` | `"Fraunces", Georgia, serif` |
| `--font-sans` | `"IBM Plex Sans", system-ui, -apple-system, sans-serif` |
| `--font-mono` | `"IBM Plex Mono", ui-monospace, Menlo, monospace` |

## Radius, motion, gutter

| Token | Value | Note |
| --- | --- | --- |
| `--radius-panel` | `14px` | Today's `--radius` |
| `--radius-control` | `9px` | Buttons and input shells, currently a literal in both |
| `--radius-chip` | `8px` | Dashboard controls, currently a literal |
| `--ease-tween` | `cubic-bezier(0.22, 0.75, 0.25, 1)` | Today's `--ease` |
| `--duration-tween` | `700ms` | Today's `--tween`, and `TWEEN_MS` in `hooks/useTween.ts` |

The page gutter keeps its current shape rather than becoming a theme value: it
is redefined inside a media query (`--pad` widens past 1100px), which a static
`@theme` entry cannot do. It stays a plain custom property in `globals.css`.

## Breakpoints

This app's own ladder, set in `@theme` so the variants match the design instead
of Tailwind's defaults. Every one is a width something already breaks at:

| Variant | Width | What breaks here |
| --- | --- | --- |
| `sm` | `640px` | Dashboard grid goes to two columns |
| `md` | `760px` | `MonthDetail` switches layout |
| `lg` | `900px` | Scenario, account and outlook cards stack; income and expense rows stack |
| `xl` | `1100px` | Dashboard grid goes to four columns; the page gutter widens |
| `2xl` | `1500px` | Body size steps up to 17px |

`lg` is the one to notice: Tailwind's default puts it at 1024px, which is not a
width anything in this design cares about, while 900px is where six different
modules already stack.

## Preflight is not installed

`@import "tailwindcss"` would bring in Preflight, Tailwind's reset. It unstyles
headings, strips list markers, re-fonts `kbd`, and makes `svg` a block — all
changes to how the site looks, which is not what installing a toolchain should
do. `globals.css` takes the theme and the utilities individually instead, and
keeps the small reset the app already had.

Adopting Preflight later is a real option, but it is its own change with its own
before-and-after shots. Worth knowing if it is ever picked up: its
`svg { display: block }` would have hidden the timeline bug that the phase 0
audit found, rather than fixing it.

## Cascade layers, and the two ways they bite

Tailwind's utilities sit in a `utilities` cascade layer. Unlayered CSS beats
every layer regardless of specificity, so the arrangement in `globals.css` is
load-bearing in both directions:

| Where a rule lives | Beats | Beaten by |
| --- | --- | --- |
| `@theme` (theme layer) | nothing here | everything below |
| `@layer base` — the element rules and the token aliases | theme | utilities, modules |
| Tailwind utilities | base | CSS Modules |
| CSS Modules (unlayered) | everything | nothing |

Modules outranking utilities is deliberate and is what keeps a half-converted
component predictable: adding a utility cannot silently override a module rule
that is still there. Phase 3 was caught by the same ordering twice, in both
directions, and both are worth knowing before phases 4 and 5:

- **An element rule outranking a utility.** `button { font-family: inherit }`
  was unlayered, so `font-mono` on an icon button did nothing and the button
  quietly rendered in the sans face. Element defaults belong in `@layer base`,
  which is where they are now.
- **Half a rule left behind.** Moving the element rules into `base` but leaving
  the `:root` token aliases unlayered put `--pad: var(--pad-bar)` above the
  `@media (min-width: 1100px)` override that widens it, which is in `base`. The
  desktop page gutter silently stopped applying and every wide layout reflowed.
  A token and the media query that overrides it have to be in the same layer.

The second one is the instructive failure: nothing errored, the build was
green, and the type scale and colours were all correct. It showed up as four
scenario cards fitting on one row where there had been three.

## One repeated block becomes a utility

Beyond the scale, one rule really is written out verbatim across the tree, and
phase 2 hoists it with Tailwind's `@utility` so it is usable from JSX as the
components convert:

- **`eyebrow`** — mono, uppercase, `--tracking-eyebrow`, `--color-ash`,
  `--text-eyebrow`. Byte-identical in eight modules.

The display headings looked like a second one and are not. Nine modules use
`--font-display`, but they share only the family: weights split 500/700, sizes
land on five different steps, and leading and tracking vary per use. There is no
common block to hoist, so they compose from `font-display` plus a size step —
which is what utilities are for.

The nine `.eyebrow` definitions are not deleted in phase 2, because removing one
means changing `styles.eyebrow` to `className="eyebrow"` in its component, and
phase 2 touches no JSX. They go as each component converts in phases 3 to 5.
