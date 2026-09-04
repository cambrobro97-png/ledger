import { DEFAULT_WIDGET_IDS, WIDGETS, widgetById } from "./widgets";

export const DASHBOARD_STORAGE_KEY = "dashboard:v1";

/** How much grid a widget asks for. Spans are resolved per breakpoint in CSS. */
export type WidgetSize = "small" | "medium" | "wide";

export const SIZE_LABELS: Record<WidgetSize, string> = {
  small: "Small",
  medium: "Medium",
  wide: "Wide",
};

/** One widget placed on the board. */
export interface PlacedWidget {
  id: string;
  size: WidgetSize;
}

export interface DashboardLayout {
  /** Schema version. Bump for a shape change, never merely to add a widget. */
  version: 1;
  /** Order is render order. */
  widgets: PlacedWidget[];
  /**
   * Every widget id this browser has been offered, including ones since
   * removed.
   *
   * This is the whole migration story. Without it there is no way to tell "the
   * user removed the cash-flow widget" from "the cash-flow widget did not exist
   * when this layout was saved" — the stored `widgets` array is identical in
   * both cases. Recording what has been *seen* rather than only what is
   * *placed* separates them, so a newly shipped widget can reach existing users
   * without resurrecting one they deliberately took off.
   */
  known: string[];
}

/** The board a browser with nothing stored opens on. */
export function createDefaultLayout(): DashboardLayout {
  return {
    version: 1,
    widgets: DEFAULT_WIDGET_IDS.map((id) => ({
      id,
      // Non-null: DEFAULT_WIDGET_IDS is derived from WIDGETS itself.
      size: widgetById(id)!.defaultSize,
    })),
    known: WIDGETS.map((widget) => widget.id),
  };
}

/**
 * Brings a stored layout up to date with the current widget registry.
 *
 * Three things can be wrong with a stored layout, and each has one right answer:
 *
 *  - A placed id that is no longer in the registry, because a widget was
 *    retired. Dropped silently. A "this widget is gone" tombstone would be
 *    noise about a decision the user did not make.
 *
 *  - A placed size the widget no longer supports, because its `sizes` changed
 *    between releases. Snapped to `defaultSize` rather than dropping the
 *    widget — the user asked for the widget, not for that particular width.
 *
 *  - A registry widget this layout has never seen. Appended at its default
 *    size, so shipping a widget puts it in front of existing users. One the
 *    user has seen and removed stays removed, because it is still in `known`.
 *
 * A layout predating `known` (or any unreadable value) is credited with having
 * seen everything currently shipping — the conservative read, which preserves
 * the arrangement and resurrects nothing.
 */
export function reconcileLayout(stored: DashboardLayout | null | undefined): DashboardLayout {
  if (!stored || stored.version !== 1 || !Array.isArray(stored.widgets)) {
    return createDefaultLayout();
  }

  const placed = new Set<string>();
  const widgets: PlacedWidget[] = [];

  for (const entry of stored.widgets) {
    const definition = entry && widgetById(entry.id);
    if (!definition) continue;
    if (placed.has(definition.id)) continue; // duplicate from a bad write
    placed.add(definition.id);
    widgets.push({
      id: definition.id,
      size: definition.sizes.includes(entry.size) ? entry.size : definition.defaultSize,
    });
  }

  const known = new Set(
    Array.isArray(stored.known) ? stored.known : WIDGETS.map((widget) => widget.id),
  );

  for (const definition of WIDGETS) {
    if (known.has(definition.id)) continue;
    known.add(definition.id);
    // A widget that isn't in the default board is opt-in; shipping it should
    // put it in the catalog, not on everyone's dashboard.
    if (!definition.inDefaultLayout) continue;
    if (placed.has(definition.id)) continue;
    placed.add(definition.id);
    widgets.push({ id: definition.id, size: definition.defaultSize });
  }

  return { version: 1, widgets, known: [...known] };
}
