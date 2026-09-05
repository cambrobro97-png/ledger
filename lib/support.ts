/**
 * Where the site asks for support, and which asks are live.
 *
 * Two destinations on purpose, because they suit different visitors:
 *
 * - Ko-fi is the one non-developers can actually complete. It takes a one-off
 *   tip with no account — card, PayPal, Apple Pay or Google Pay — and charges
 *   nothing on tips, so it is both the easiest path and the cheapest.
 * - GitHub Sponsors costs nothing at all on personal sponsorships, but it
 *   requires the sponsor to be signed in to GitHub, which rules out most of
 *   the people using these tools. It is the quieter, second link for the
 *   developers who arrive through the repository.
 *
 * Both are plain outbound links rather than either platform's embed widget:
 * a script from a payments host would run on every page of a tool that keeps
 * the visitor's balances in `localStorage`, which is the one promise the
 * README makes, and its floating button is appended outside React so it would
 * sit over the charts in presentation mode where the rest of the chrome steps
 * aside. A link sends nothing until it is clicked.
 */

/** Marks a URL as not yet filled in. */
const PLACEHOLDER = "YOUR_HANDLE";

/**
 * The URL, or null while it still holds the placeholder. Every caller renders
 * nothing for a null, so a half-finished link cannot reach production and an
 * unenrolled Sponsors page cannot 404 in the footer.
 */
function live(url: string): string | null {
  return url.includes(PLACEHOLDER) ? null : url;
}

/** Set to the Ko-fi page, e.g. `https://ko-fi.com/${PLACEHOLDER}`. */
export const KOFI_URL = live(`https://ko-fi.com/${PLACEHOLDER}`);

/**
 * Set to `https://github.com/sponsors/${PLACEHOLDER}` once the account is
 * accepted into GitHub Sponsors. The page 404s before enrolment, which is why
 * it stays behind the placeholder rather than shipping as a dead link.
 */
export const SPONSORS_URL = live(`https://github.com/sponsors/${PLACEHOLDER}`);

/** Whether there is any live destination worth showing an ask for. */
export const SUPPORT_ENABLED = KOFI_URL !== null || SPONSORS_URL !== null;
