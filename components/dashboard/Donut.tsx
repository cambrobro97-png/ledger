"use client";

import styles from "./Donut.module.css";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutProps {
  /** Drawn clockwise from twelve o'clock, in the order given. */
  segments: DonutSegment[];
  /**
   * How many segments the legend names. The rest are gathered into a single
   * "everything else" row rather than dropped, so the rows still add up to the
   * ring. Zero draws the ring alone, which is what a small card gets.
   */
  legend?: number;
  /** Formats a segment's value for the legend. */
  format: (value: number) => string;
  label: string;
}

/** Radius and stroke chosen so the ring's hole is a little wider than its band. */
const RADIUS = 38;
const STROKE = 18;

/**
 * A ring split by share.
 *
 * Drawn as dashed circles rather than arc paths: `pathLength` normalises the
 * circumference to 100, so a segment is its own percentage and the one case
 * arc maths always gets wrong — a single category holding the whole ring, where
 * the start and end points coincide — simply doesn't arise.
 */
export function Donut({ segments, legend = 0, format, label }: DonutProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (total <= 0) return null;

  // A hairline between neighbours, but never between a segment and itself.
  const gap = segments.length > 1 ? 0.7 : 0;

  // Each segment starts where everything before it ended. Summed per segment
  // rather than carried in a running total, because a variable mutated from
  // inside a render callback is exactly what `react-hooks` rules out.
  const arcs = segments.map((segment, index) => ({
    ...segment,
    share: (segment.value / total) * 100,
    offset:
      (segments.slice(0, index).reduce((sum, earlier) => sum + earlier.value, 0) / total) * 100,
  }));

  const named = arcs.slice(0, legend);
  const rest = arcs.slice(legend);
  const restTotal = rest.reduce((sum, arc) => sum + arc.value, 0);

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox="0 0 100 100"
        role="img"
        aria-label={label}
      >
        <g transform="rotate(-90 50 50)">
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={50}
              cy={50}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              pathLength={100}
              strokeDasharray={`${Math.max(0, arc.share - gap)} ${100 - Math.max(0, arc.share - gap)}`}
              strokeDashoffset={-arc.offset}
              opacity={0.92}
            />
          ))}
        </g>
      </svg>

      {legend > 0 ? (
        <ul className={styles.legend}>
          {named.map((arc) => (
            <li key={arc.label} className={styles.row}>
              <span className={styles.swatch} style={{ background: arc.color }} />
              <span className={styles.name}>{arc.label}</span>
              <span className={styles.amount}>{format(arc.value)}</span>
            </li>
          ))}
          {rest.length > 0 ? (
            <li className={styles.row}>
              <span className={`${styles.swatch} ${styles.restSwatch}`} />
              <span className={styles.name}>
                {rest.length} more
              </span>
              <span className={styles.amount}>{format(restTotal)}</span>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
