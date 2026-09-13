/**
 * Joins class names, dropping anything falsy.
 *
 * Every conditional `className` in the app is some variation on
 * `[base, flag ? styles.on : ""].filter(Boolean).join(" ")`, which buries the
 * interesting part — which class, under which condition — in the plumbing.
 * `undefined` and `false` are accepted alongside `""` so a condition can be
 * written as `flag && styles.on` rather than padded out to a ternary.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
