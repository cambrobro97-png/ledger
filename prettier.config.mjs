/**
 * Formatting, and the class-order rule that matters more than the formatting.
 *
 * `prettier-plugin-tailwindcss` sorts utility classes into Tailwind's own
 * canonical order. That is the enforcement half of this migration: without it
 * two people writing the same element produce two different class strings, and
 * the lists drift exactly the way the 51 font sizes did.
 *
 * `printWidth` is 100 rather than the default 80 because that is where this
 * codebase already sat — the 99th percentile line was 103 characters before
 * any of this was touched.
 */
const config = {
  printWidth: 100,
  plugins: ["prettier-plugin-tailwindcss"],
  // The helper that composes conditional class names, so its arguments are
  // sorted too rather than only bare `className` strings.
  tailwindFunctions: ["cn"],
  tailwindStylesheet: "./app/globals.css",
};

export default config;
