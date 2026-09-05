import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
