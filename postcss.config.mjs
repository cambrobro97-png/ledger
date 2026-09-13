/*
 * Turbopack reads this from the project root. Tailwind v4 needs no separate
 * config file — the design tokens live in `@theme` in app/globals.css.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
