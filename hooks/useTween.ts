"use client";

import { useEffect, useRef, useState } from "react";

export const TWEEN_MS = 700;

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

/**
 * Eases a single number toward its target. Used for the headline figures so
 * they count into place instead of snapping.
 */
export function useTweenedNumber(target: number, duration = TWEEN_MS): number {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (duration === 0) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    const from = currentRef.current;
    if (from === target) return;
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const next = from + (target - from) * easeOutCubic(progress);
      currentRef.current = next;
      setValue(next);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return value;
}

/** A window onto a timeline, measured in the timeline's own units. */
export interface Viewport {
  start: number;
  end: number;
}

/**
 * Eases a window's two edges together, so zooming reads as one motion rather
 * than two independent slides.
 *
 * This is what a timeline needs and `useTweenedSeries` cannot give it: marks
 * are positioned by mapping through the returned viewport every frame, so the
 * whole field of items spreads and gathers as a unit, and items may be added
 * or removed mid-flight without interrupting the zoom.
 *
 * `target` must be referentially stable between renders (memoize it), or the
 * animation restarts on every pass.
 */
export function useTweenedViewport(target: Viewport, duration = TWEEN_MS): Viewport {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = currentRef.current;

    if (duration === 0) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    if (from.start === target.start && from.end === target.end) return;
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = easeOutCubic(progress);
      const next =
        progress < 1
          ? {
              start: from.start + (target.start - from.start) * eased,
              end: from.end + (target.end - from.end) * eased,
            }
          : target;
      currentRef.current = next;
      setValue(next);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return value;
}

/**
 * Eases every point of a series toward a new series of the same length, so a
 * chart slides between scenarios. A change in length means the axis itself
 * changed, so the new series is adopted immediately instead.
 *
 * `target` must be referentially stable between renders (memoize it), or the
 * animation restarts on every pass.
 */
export function useTweenedSeries(target: number[], duration = TWEEN_MS): number[] {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = currentRef.current;

    if (duration === 0 || from.length !== target.length) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = easeOutCubic(progress);
      const next =
        progress < 1
          ? target.map((point, index) => from[index] + (point - from[index]) * eased)
          : target;
      currentRef.current = next;
      setValue(next);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return value;
}
