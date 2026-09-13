<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Styling

Tailwind v4, with a dozen CSS Modules left on purpose. The design tokens live in
one `@theme` block in `app/globals.css`; `docs/design-tokens.md` is the contract
and explains the type scale, the breakpoint convention, and the cascade layers.

**Where a style goes.** Utilities in the JSX, for everything that is layout,
colour, type or spacing. A CSS Module only for what utilities express badly, and
the list is short and closed:

- SVG paint — `fill`, `stroke`, `stroke-dasharray`, `paint-order`
- Keyframes, and the `prefers-reduced-motion` rule that turns them off
- Vendor pseudo-elements — `::-webkit-scrollbar`, the number-input spinners
- Multi-stop gradients, which as one arbitrary value are unreadable
- Grid reflows that place cells with `nth-child`

The test for anything else is whether the utilities read at least as well as the
CSS did. If the answer is no, leave it, and say why in the file.

**Two rules with teeth.**

- *Pick, do not layer.* Never ship two utilities for the same property and let
  the cascade settle it — `icon ? "px-3" : "px-3.5"`, not both. Which one wins
  depends on the order Tailwind emits them in, which is not a decision anyone
  made. `npm run lint` fails on this; it caught a drag handle rendering with the
  wrong cursor and colour that no screenshot could have.
- *Sibling selectors do not survive the move.* `.a + .a` means "every one but
  the first", which is not what `first:` means — `first:` is about being the
  first child, and there is usually something else above. The component knows
  its own ordering, so it says so.

**Before pushing a change to how anything looks.** `npm run build`, then
`npm run shots <label>` before and after, then
`node scripts/shoot.mjs --compare before after`. There are no tests here; the
shots are what makes "nothing moved" checkable. They are taken with the clock
frozen and motion reduced, so anything behind a hover, a keyframe or an
interaction needs checking in the browser instead.

One false alarm is worth knowing about. Reformatting JSX can move a handful of
pixels without changing a character of text: Prettier replaces `{" "}`
line-end separators with ordinary spaces, which moves React's text-node
boundaries, and Chrome breaks glyph shaping at those seams — so one kerning
pair renders a pixel differently. It shows up as a few dozen differing pixels
in a single glyph-sized box. Compare the rendered text before assuming a
regression; `npm run format` landing three such shots is the expected result,
not a bug.

`npm run format` sorts utility classes into Tailwind's canonical order. Run it
before committing, or the same element written twice produces two different
class strings.
