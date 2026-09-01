/** Plot box for a chart, in the SVG's own viewBox units. */
export interface Plot {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const LINE_PLOT: Plot = { width: 1000, height: 430, left: 78, right: 22, top: 18, bottom: 44 };
export const BAR_PLOT: Plot = { width: 1000, height: 340, left: 78, right: 22, top: 18, bottom: 40 };
/** Room at the top for the month band, and at the bottom for the date axis. */
export const TIMELINE_PLOT: Plot = { width: 1000, height: 360, left: 20, right: 20, top: 54, bottom: 46 };

export const innerWidth = (plot: Plot) => plot.width - plot.left - plot.right;
export const innerHeight = (plot: Plot) => plot.height - plot.top - plot.bottom;

export const xAt = (plot: Plot, index: number, length: number) =>
  plot.left + (index / length) * innerWidth(plot);

export const yAt = (plot: Plot, value: number, max: number) =>
  plot.top + innerHeight(plot) - (value / max) * innerHeight(plot);

/** Rounds an axis maximum up to a readable 1 / 2 / 2.5 / 5 step. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** How many years to skip between x-axis labels so they never collide. */
export function yearLabelStep(totalYears: number): number {
  if (totalYears <= 12) return 2;
  if (totalYears <= 26) return 5;
  return 10;
}

export function linePath(plot: Plot, values: number[], max: number, length: number): string {
  let path = "";
  for (let index = 0; index < values.length; index += 1) {
    const x = xAt(plot, index, length).toFixed(2);
    const y = yAt(plot, values[index], max).toFixed(2);
    path += `${index ? "L" : "M"}${x} ${y}`;
  }
  return path;
}

/** A line closed down to the baseline, for filled areas. */
export function areaPath(plot: Plot, values: number[], max: number, length: number): string {
  const floor = (plot.top + innerHeight(plot)).toFixed(2);
  return (
    `${linePath(plot, values, max, length)}` +
    `L${(plot.left + innerWidth(plot)).toFixed(2)} ${floor}` +
    `L${plot.left.toFixed(2)} ${floor}Z`
  );
}

/** The region enclosed by two lines, used to shade interest avoided. */
export function betweenPath(
  plot: Plot,
  upper: number[],
  lower: number[],
  max: number,
  length: number,
): string {
  let path = linePath(plot, upper, max, length);
  for (let index = lower.length - 1; index >= 0; index -= 1) {
    path += `L${xAt(plot, index, length).toFixed(2)} ${yAt(plot, lower[index], max).toFixed(2)}`;
  }
  return `${path}Z`;
}
