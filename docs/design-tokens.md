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
fresh because there was nothing to reach for. Eleven steps cover every use.

## Type scale

| Token | Value | Role, and what it replaces |
| --- | --- | --- |
| `--text-micro` | `clamp(9.5px, 0.65vw, 11px)` | Provenance lines. `ConnectionsWidget.from`, `AgeRibbon.payoffLabel`, `Dashboard.catalogOwner` |
| `--text-label` | `clamp(10px, 0.72vw, 12px)` | Mono metadata above a value. `MetricCard.key`, `WidgetShell.eyebrow`/`note`, `ExpenseItemRow.linkBadge`/`annual`, `MonthDetail.eyebrow`/`meta`/`share`, `ExpenseEditor.groupTitle`/`groupMeta`, `MortgageLinkPicker.title`, `ExpenseMetrics.categoriesHead`/`noteLabel` |
| `--text-eyebrow` | `clamp(10px, 0.72vw, 13px)` | The section eyebrow, already identical in 7 files: `Hero`, `LoanPanel`, `ToolPlaceholder`, `TopBar`, `ProfilePanel`, `RetirementHero`, `Panel` |
| `--text-sm` | `clamp(11px, 0.85vw, 13px)` | Notes and hints under a control. The 13-use cluster, its three near-twins, and the fixed `11.5px` / `12px` / `12.5px` small text |
| `--text-base` | `clamp(11.5px, 0.85vw, 14px)` | Supporting text with a job. `TermRibbon`/`AgeRibbon.labels`, `charts.readout`, `Dashboard.catalogHint`/`emptyHint`, `ExpenseMetrics.legendItem`, `WidgetShell.detail`, `YearSwitcher.hint` |
| `--text-body` | `clamp(13px, 0.95vw, 15px)` | Default reading size. `MonthDetail.name`, the `empty` states, `RedirectPanel.verdict`, `ScenarioCard.name`, `AccountCard.name`, `Field.affix`/`toggleLabel`, and the fixed `13px` / `14px` / `14.5px` / `15px` body text |
| `--text-lg` | `clamp(14px, 1.05vw, 19px)` | Lead-in prose and wordmarks. `Hero.sub`, `RetirementHero.sub`, `ToolPlaceholder.blurb`, `SiteHeader.wordmark`, `SiteFooter.wordmark`, `WidgetShell.title`, `Field.select`, `ExpenseItemRow.derived` |
| `--text-title` | `clamp(17px, 1.35vw, 25px)` | Panel and card headings. `Panel.title`, `Dashboard.catalogTitle`/`emptyTitle`, `LoanPanel.chipValue`, `ProfilePanel.chipValue`, `OccurrenceCard.amount`, `ExpenseMetrics.noteValue` |
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
  still. This is the biggest single change in the scale and the one to look at
  first in the phase 2 shots.
- `ToolPlaceholder.title` drops from `clamp(28px, 3.2vw, 52px)` to
  `--text-display`, and `TopBar.title` rises to it from
  `clamp(26px, 2.4vw, 44px)`. They are the same role and were never meant to
  differ.

### SVG text is not on this scale

Seven of the 51 values sit on `<text>` inside an SVG `viewBox`, where `px` is a
*user unit* that scales with the chart, not a CSS pixel. Putting a `vw`-based
clamp on them would scale them twice and break at both ends. They stay literal,
in the modules listed as permanent in the migration plan:

`charts.axisLabel` · `charts.markerLabel` · `TimelineChrome.bandLabel` ·
`TimelineChrome.railLabel` · `TimelineChrome.dayLabel` · `TimelineChrome.empty` ·
`MonthTicks.tick`

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

## Two repeated blocks become utilities

Beyond the scale, two rules are written out verbatim across the tree. Phase 2
hoists them with Tailwind's `@utility`, so they are usable from JSX and from the
modules that remain:

- **`eyebrow`** — mono, uppercase, `0.18em` tracking, `--color-ash`,
  `--text-eyebrow`. Defined in 9 files, 8 of them byte-identical.
- **`display-title`** — `--font-display`, weight 500, `-0.01em` tracking.
  Defined in 9 files.
