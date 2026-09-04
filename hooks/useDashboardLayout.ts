"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  DASHBOARD_STORAGE_KEY,
  type DashboardLayout,
  type WidgetSize,
  createDefaultLayout,
  reconcileLayout,
} from "@/lib/dashboardLayout";
import { widgetById } from "@/lib/widgets";
import { usePersistedState } from "./usePersistedState";

export interface DashboardLayoutModel {
  hydrated: boolean;
  layout: DashboardLayout;
  /** Ids currently on the board, for the catalog to exclude. */
  placedIds: Set<string>;
  move: (id: string, direction: 1 | -1) => void;
  /** Moves a widget to an absolute index — the drop half of drag-and-drop. */
  moveTo: (id: string, toIndex: number) => void;
  setSize: (id: string, size: WidgetSize) => void;
  /** Cycles to the next size the widget supports, wrapping. */
  cycleSize: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  reset: () => void;
}

/** Owns the dashboard arrangement. The widgets themselves own their data. */
export function useDashboardLayout(): DashboardLayoutModel {
  const { value: layout, setValue, reset, hydrated } = usePersistedState<DashboardLayout>(
    DASHBOARD_STORAGE_KEY,
    createDefaultLayout,
  );

  // Reconciliation runs once, after the stored value has landed — the same
  // shape as `useClockDefaults`. It has to *commit*, not just render: if the
  // reconciled `known` were never written back, a widget the user removed
  // would reappear on the next release that touches the registry.
  const reconciled = useRef(false);

  useEffect(() => {
    if (!hydrated || reconciled.current) return;
    reconciled.current = true;
    setValue((prev) => reconcileLayout(prev));
  }, [hydrated, setValue]);

  const placedIds = useMemo(
    () => new Set(layout.widgets.map((widget) => widget.id)),
    [layout.widgets],
  );

  const move = useCallback<DashboardLayoutModel["move"]>(
    (id, direction) =>
      setValue((prev) => {
        const index = prev.widgets.findIndex((widget) => widget.id === id);
        const next = index + direction;
        // Clamped rather than wrapping: a widget pushed off one end reappearing
        // at the other reads as a bug when you are nudging it into place.
        if (index === -1 || next < 0 || next >= prev.widgets.length) return prev;
        const widgets = [...prev.widgets];
        [widgets[index], widgets[next]] = [widgets[next], widgets[index]];
        return { ...prev, widgets };
      }),
    [setValue],
  );

  const moveTo = useCallback(
    (id: string, toIndex: number) =>
      setValue((prev) => {
        const from = prev.widgets.findIndex((widget) => widget.id === id);
        if (from === -1 || toIndex < 0 || toIndex >= prev.widgets.length || from === toIndex) {
          return prev;
        }
        const widgets = [...prev.widgets];
        const [moved] = widgets.splice(from, 1);
        widgets.splice(toIndex, 0, moved);
        return { ...prev, widgets };
      }),
    [setValue],
  );

  const setSize = useCallback<DashboardLayoutModel["setSize"]>(
    (id, size) =>
      setValue((prev) => ({
        ...prev,
        widgets: prev.widgets.map((widget) =>
          widget.id === id ? { ...widget, size } : widget,
        ),
      })),
    [setValue],
  );

  const cycleSize = useCallback(
    (id: string) =>
      setValue((prev) => ({
        ...prev,
        widgets: prev.widgets.map((widget) => {
          if (widget.id !== id) return widget;
          const definition = widgetById(widget.id);
          if (!definition) return widget;
          const at = definition.sizes.indexOf(widget.size);
          const next = definition.sizes[(at + 1) % definition.sizes.length];
          return { ...widget, size: next };
        }),
      })),
    [setValue],
  );

  const add = useCallback(
    (id: string) =>
      setValue((prev) => {
        const definition = widgetById(id);
        if (!definition) return prev;
        if (prev.widgets.some((widget) => widget.id === id)) return prev;
        return {
          ...prev,
          widgets: [...prev.widgets, { id, size: definition.defaultSize }],
          known: prev.known.includes(id) ? prev.known : [...prev.known, id],
        };
      }),
    [setValue],
  );

  const remove = useCallback(
    (id: string) =>
      setValue((prev) => ({
        ...prev,
        widgets: prev.widgets.filter((widget) => widget.id !== id),
        // Stays in `known`, which is what keeps a later release from putting
        // it back.
        known: prev.known.includes(id) ? prev.known : [...prev.known, id],
      })),
    [setValue],
  );

  return {
    hydrated,
    layout,
    placedIds,
    move,
    moveTo,
    setSize,
    cycleSize,
    add,
    remove,
    reset,
  };
}
