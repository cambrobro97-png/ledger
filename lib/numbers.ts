/**
 * Arithmetic that has to give the same answer everywhere.
 *
 * This app prerenders in Node and hydrates in the browser. IEEE 754 requires
 * `+`, `-`, `*`, `/` and `sqrt` to be correctly rounded, so those agree between
 * any two engines to the last bit — but it says nothing about `pow`, `log` or
 * the rest of the transcendental family, and V8 in Node and V8 in Chrome do
 * return results an ulp apart for the same inputs.
 *
 * Ordinarily that is invisible. Here it is not: a projection figure that
 * differs in its last bit reaches the DOM as an SVG coordinate written one
 * digit differently, and React reports a hydration mismatch it will not patch.
 * So anything whose result ends up in rendered markup is built out of the
 * operations the standard actually pins down.
 */

/**
 * `base` raised to an integer power, by multiplication alone.
 *
 * Exponentiation by squaring, so a long horizon costs a handful of steps rather
 * than one per year, and every step is a multiplication — which every engine
 * rounds identically. A negative exponent reciprocates once at the end, since
 * division is correctly rounded too.
 *
 * The results differ from `Math.pow`'s by at most an ulp, which is far below
 * anything this app displays.
 */
export function powInt(base: number, exponent: number): number {
  const whole = Math.trunc(exponent);
  if (whole < 0) return 1 / powInt(base, -whole);

  let result = 1;
  let factor = base;
  let remaining = whole;

  while (remaining > 0) {
    if (remaining % 2 === 1) result *= factor;
    remaining = Math.floor(remaining / 2);
    // Guarded, so the last round can't square its way to Infinity for nothing.
    if (remaining > 0) factor *= factor;
  }

  return result;
}

/**
 * The largest power of ten no greater than `value`, for a value above zero.
 *
 * Stepped rather than taken from `Math.log10`, for the reason at the top of this
 * file — and because flooring a logarithm is fragile exactly where it matters
 * most: at a power of ten, where an answer a hair under the integer drops the
 * magnitude by a factor of ten.
 */
export function decimalMagnitude(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;

  let exponent = 0;
  while (powInt(10, exponent + 1) <= value) exponent += 1;
  while (powInt(10, exponent) > value) exponent -= 1;
  return powInt(10, exponent);
}
