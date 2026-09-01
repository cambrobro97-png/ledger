/**
 * Everything that differs between the two environments, in one place.
 *
 * The site is a static export, so the environment is decided at *build* time
 * rather than at request time: `NEXT_PUBLIC_SITE_URL` is inlined into the
 * bundle by `next build`. That is why each stage carries its own `siteUrl`
 * and why a single artifact can never be promoted from dev to prod.
 */

export type Stage = "dev" | "prod";

export const ROOT_DOMAIN = "ledger-1.com";

export const GITHUB_OWNER = "cambrobro97-png";
export const GITHUB_REPO = "ledger";

/**
 * The prefix every OIDC token's `sub` claim carries, which the deploy roles
 * match on. Repositories created after 15 July 2026 identify themselves by
 * numeric owner and repository id as well as by name, so that a subject can
 * never be forged by deleting a repo and recreating it under the same name.
 * Read it back with:
 *
 *   gh api repos/OWNER/REPO/actions/oidc/customization/sub
 */
export const GITHUB_SUB_PREFIX =
  "repo:cambrobro97-png@323599967/ledger@1353558439";

/**
 * The account already has a GitHub Actions OIDC provider, created for an
 * earlier project. IAM allows only one provider per URL, so this is imported
 * by ARN rather than declared — creating a second one would fail the deploy.
 */
export const GITHUB_OIDC_PROVIDER_ARN =
  "arn:aws:iam::971422711298:oidc-provider/token.actions.githubusercontent.com";

export interface StageConfig {
  /** Every name the certificate covers and the distribution answers to. */
  domains: string[];
  /** The canonical origin, inlined into the bundle as NEXT_PUBLIC_SITE_URL. */
  siteUrl: string;
  bucketName: string;
  /** The only branch whose workflow runs may assume this stage's role. */
  branch: string;
  /** Redirect every other host to the apex. Production only. */
  redirectToApex: boolean;
  /** Send `X-Robots-Tag: noindex`. Dev only. */
  noindex: boolean;
}

export const CONFIG: Record<Stage, StageConfig> = {
  dev: {
    domains: [`dev.${ROOT_DOMAIN}`],
    siteUrl: `https://dev.${ROOT_DOMAIN}`,
    bucketName: "ledger-dev-971422711298",
    branch: "dev",
    redirectToApex: false,
    noindex: true,
  },
  prod: {
    domains: [ROOT_DOMAIN, `www.${ROOT_DOMAIN}`],
    siteUrl: `https://${ROOT_DOMAIN}`,
    bucketName: "ledger-prod-971422711298",
    branch: "main",
    redirectToApex: true,
    noindex: false,
  },
};
