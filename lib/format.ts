const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const centsDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return wholeDollars.format(Math.round(value));
}

export function formatMoneyPrecise(value: number): string {
  return centsDollars.format(value);
}

/** Short form for axis labels: $250k, $1.2M. */
export function formatMoneyCompact(value: number): string {
  const size = Math.abs(value);
  if (size >= 1_000_000) return `$${(value / 1_000_000).toFixed(size >= 10_000_000 ? 0 : 1)}M`;
  if (size >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
}

export function formatRate(apr: number): string {
  return `${Number(apr.toFixed(3))}%`;
}

/** Turns a payment count into "6 years 4 months". */
export function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const yearLabel = `${years} ${years === 1 ? "year" : "years"}`;
  const monthLabel = `${months} ${months === 1 ? "month" : "months"}`;
  if (years && months) return `${yearLabel} ${monthLabel}`;
  if (years) return yearLabel;
  return monthLabel;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
