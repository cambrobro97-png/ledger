"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import headStyles from "@/components/TopBar.module.css";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SIZE_LABELS, type WidgetSize } from "@/lib/dashboardLayout";
import { TOOLS, type ToolId } from "@/lib/tools";
import { WIDGETS, widgetById, type WidgetDefinition } from "@/lib/widgets";
import styles from "./Dashboard.module.css";

/** Widgets keep their drag handle only where HTML5 drag actually fires. */
const POINTER_QUERY = "(min-width: 640px)";

function ownerLabel(owner: ToolId | "cross"): string {
  if (owner === "cross") return "Across tools";
  return TOOLS.find((tool) => tool.id === owner)?.name ?? owner;
}

export function Dashboard() {
  const { layout, placedIds, move, moveTo, cycleSize, add, remove, reset } =
    useDashboardLayout();

  const [editing, setEditing] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // A wide widget gets the whole column on a phone anyway, so it is handed
  // "small" and renders its compact form rather than squeezing a chart in.
  // `useMediaQuery` starts false, so the phone branch is also the server
  // branch — nothing pops in on mobile.
  const roomy = useMediaQuery(POINTER_QUERY);

  const announce = useCallback((message: string) => setAnnouncement(message), []);

  const handleMove = useCallback(
    (definition: WidgetDefinition, direction: 1 | -1) => {
      const from = layout.widgets.findIndex((widget) => widget.id === definition.id);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= layout.widgets.length) return;
      move(definition.id, direction);
      announce(
        `${definition.title} moved to position ${to + 1} of ${layout.widgets.length}.`,
      );
    },
    [announce, layout.widgets, move],
  );

  const handleCycleSize = useCallback(
    (definition: WidgetDefinition, current: WidgetSize) => {
      const next =
        definition.sizes[(definition.sizes.indexOf(current) + 1) % definition.sizes.length];
      cycleSize(definition.id);
      announce(`${definition.title} set to ${SIZE_LABELS[next].toLowerCase()}.`);
    },
    [announce, cycleSize],
  );

  const handleRemove = useCallback(
    (definition: WidgetDefinition) => {
      remove(definition.id);
      announce(`${definition.title} removed. It is in the list below if you want it back.`);
    },
    [announce, remove],
  );

  const handleAdd = useCallback(
    (definition: WidgetDefinition) => {
      add(definition.id);
      announce(`${definition.title} added to the end of the dashboard.`);
    },
    [add, announce],
  );

  const available = WIDGETS.filter((definition) => !placedIds.has(definition.id));
  const isEmpty = layout.widgets.length === 0;

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <div className={headStyles.eyebrow}>Everything at a glance</div>
          <h1 className={headStyles.title}>The big picture</h1>
        </div>

        <div className={styles.actions}>
          {editing ? (
            <Button variant="ghost" onClick={reset}>
              Reset layout
            </Button>
          ) : null}
          <Button
            onClick={() => {
              setEditing((was) => !was);
              setAnnouncement("");
            }}
            aria-pressed={editing}
          >
            {editing ? "Done" : "Customise"}
          </Button>
        </div>
      </header>

      <p className={styles.hint}>
        {editing
          ? "Reorder with the arrows, change a card's width with its size button, or drop one off. Anything you remove is listed below."
          : "Every tool's headline figure in one place. Press Customise to rearrange."}
      </p>

      {/* Announces reorder and resize for the button path, which is what makes
          it genuinely usable rather than merely operable. */}
      <div className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </div>

      {isEmpty ? (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Nothing on the dashboard</h2>
          <p className={styles.emptyHint}>
            You have taken every card off. Add one back below, or start over.
          </p>
          {editing ? null : <Button onClick={() => setEditing(true)}>Customise</Button>}
        </div>
      ) : (
        <ul className={`${styles.grid} ${editing ? styles.editing : ""}`}>
          {layout.widgets.map((placed, index) => {
            const definition = widgetById(placed.id);
            if (!definition) return null;

            const { Component } = definition;
            const effectiveSize: WidgetSize = roomy ? placed.size : "small";
            const sizeClass =
              placed.size === "wide"
                ? styles.wide
                : placed.size === "medium"
                  ? styles.medium
                  : "";

            const card = <Component size={effectiveSize} />;

            return (
              <li
                key={placed.id}
                className={[
                  styles.cell,
                  sizeClass,
                  draggingId === placed.id ? styles.dragging : "",
                  overId === placed.id && draggingId !== placed.id ? styles.dropTarget : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDragOver={
                  editing
                    ? (event) => {
                        if (!draggingId) return;
                        // Without preventDefault the drop never fires.
                        event.preventDefault();
                        if (overId !== placed.id) setOverId(placed.id);
                      }
                    : undefined
                }
                onDrop={
                  editing
                    ? (event) => {
                        event.preventDefault();
                        if (draggingId && draggingId !== placed.id) {
                          const moved = widgetById(draggingId);
                          moveTo(draggingId, index);
                          if (moved) {
                            announce(
                              `${moved.title} moved to position ${index + 1} of ${layout.widgets.length}.`,
                            );
                          }
                        }
                        setDraggingId(null);
                        setOverId(null);
                      }
                    : undefined
                }
              >
                {editing ? (
                  <div className={styles.editCard}>
                    <div className={styles.controls}>
                      {roomy ? (
                        <span
                          className={`${styles.control} ${styles.handle}`}
                          draggable
                          aria-hidden="true"
                          onDragStart={(event) => {
                            setDraggingId(placed.id);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", placed.id);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setOverId(null);
                          }}
                        >
                          ⠿
                        </span>
                      ) : null}

                      <button
                        type="button"
                        className={styles.control}
                        disabled={index === 0}
                        aria-label={`Move ${definition.title} earlier`}
                        onClick={() => handleMove(definition, -1)}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className={styles.control}
                        disabled={index === layout.widgets.length - 1}
                        aria-label={`Move ${definition.title} later`}
                        onClick={() => handleMove(definition, 1)}
                      >
                        →
                      </button>

                      <button
                        type="button"
                        className={`${styles.control} ${styles.sizeControl}`}
                        aria-label={`${definition.title} size: ${SIZE_LABELS[placed.size]}. Change size.`}
                        onClick={() => handleCycleSize(definition, placed.size)}
                      >
                        {SIZE_LABELS[placed.size]}
                      </button>

                      <span className={styles.spacer} />

                      <button
                        type="button"
                        className={`${styles.control} ${styles.removeControl}`}
                        aria-label={`Remove ${definition.title}`}
                        onClick={() => handleRemove(definition)}
                      >
                        ✕
                      </button>
                    </div>
                    {card}
                  </div>
                ) : (
                  // Only a card that is not being rearranged navigates.
                  <Link href={definition.href} className={styles.cellLink}>
                    {card}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <section className={styles.catalog} aria-label="Widgets you can add">
          <h2 className={styles.catalogTitle}>Add a card</h2>
          <p className={styles.catalogHint}>
            {available.length === 0
              ? "Every card is already on your dashboard."
              : "These are not on your dashboard yet."}
          </p>

          {available.length > 0 ? (
            <ul className={styles.catalogList}>
              {available.map((definition) => (
                <li key={definition.id}>
                  <button
                    type="button"
                    className={styles.catalogItem}
                    onClick={() => handleAdd(definition)}
                  >
                    <span className={styles.catalogOwner}>{ownerLabel(definition.owner)}</span>
                    <span className={styles.catalogName}>{definition.title}</span>
                    <span className={styles.catalogBlurb}>{definition.blurb}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
