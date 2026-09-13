import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwind from "eslint-plugin-better-tailwindcss";

/*
 * Next 16 removed `next lint`, so this is the config the ESLint CLI reads
 * directly — `npm run lint` no longer goes through Next at all.
 *
 * `globalIgnores` replaces the defaults `eslint-config-next` ships rather than
 * adding to them, so the build output it would have ignored is repeated here.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.tsx"],
    plugins: { "better-tailwindcss": betterTailwind },
    settings: {
      "better-tailwindcss": {
        entryPoint: "app/globals.css",
        // Only look where classes actually are. Left to its own heuristics the
        // plugin reads the `--accent` key of a `style` object as a class name,
        // which is how the per-instance accents are set all over this app.
        attributes: ["className"],
        callees: ["cn"],
        variables: [],
        tags: [],
      },
    },
    rules: {
      // The rules that catch what a reviewer cannot: two utilities fighting
      // over one property, and a class that no longer exists in the theme.
      // Formatting and ordering are Prettier's job, so those rules stay off.
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
    },
  },
  globalIgnores([
    // What eslint-config-next ignores on its own.
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The infrastructure package is its own npm project with its own tsconfig,
    // and none of the React or Next rules above apply to it. The root
    // tsconfig excludes it for the same reason.
    "cdk/**",
  ]),
]);
