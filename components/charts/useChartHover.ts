"use client";

import { useCallback, useState, type PointerEvent } from "react";
import { innerWidth, type Plot } from "./geometry";

/**
 * Maps a pointer position over a chart to an index in the series, so the
 * card can report the numbers under the cursor.
 */
export function useChartHover(plot: Plot, length: number) {
  const [index, setIndex] = useState<number | null>(null);

  const onPointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (bounds.width === 0) return;
      const x = ((event.clientX - bounds.left) / bounds.width) * plot.width;
      const ratio = (x - plot.left) / innerWidth(plot);
      setIndex(Math.round(Math.max(0, Math.min(1, ratio)) * length));
    },
    [plot, length],
  );

  const onPointerLeave = useCallback(() => setIndex(null), []);

  return { index, handlers: { onPointerMove, onPointerLeave } };
}
