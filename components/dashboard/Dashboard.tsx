"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ToolHeading } from "@/components/ToolHead";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { SIZE_LABELS, type WidgetSize } from "@/lib/dashboardLayout";
import { TOOLS, type ToolId } from "@/lib/tools";
import { WIDGETS, widgetById, type WidgetDefinition } from "@/lib/widgets";

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
    <main className="mx-auto max-w-[1600px] px-(--pad) pb-[clamp(48px,6vw,96px)] pt-[clamp(20px,3vw,44px)]">
      <header className="flex flex-wrap items-end justify-between gap-3.5">
        <ToolHeading
          eyebrow="Everything at a glance"
          title="The big picture"
          className="min-w-0"
        />

        <div className="flex flex-wrap gap-2">
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

      <p className="mx-0 mb-0 mt-2.5 max-w-[62ch] text-body text-ash">
        {editing
          ? "Reorder with the arrows, change a card's width with its size button, or drop one off. Anything you remove is listed below."
          : "Every tool's headline figure in one place. Press Customise to rearrange."}
      </p>

      {/* Announces reorder and resize for the button path, which is what makes
          it genuinely usable rather than merely operable. */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      {isEmpty ? (
        <div className="mt-[clamp(16px,1.8vw,28px)] rounded-panel border border-dashed border-rule bg-panel px-[clamp(18px,2vw,32px)] py-[clamp(28px,4vw,56px)] text-center">
          <h2 className="m-0 font-display text-title font-medium">Nothing on the dashboard</h2>
          <p className="mx-0 mb-4 mt-2 text-base text-ash">
            You have taken every card off. Add one back below, or start over.
          </p>
          {editing ? null : <Button onClick={() => setEditing(true)}>Customise</Button>}
        </div>
      ) : (
        <ul className="mt-[clamp(16px,1.8vw,28px)] grid list-none grid-cols-1 items-stretch gap-[clamp(12px,1.2vw,18px)] p-0 sm:grid-cols-2 xl:grid-cols-4">
          {layout.widgets.map((placed, index) => {
            const definition = widgetById(placed.id);
            if (!definition) return null;

            const { Component } = definition;
            const effectiveSize: WidgetSize = roomy ? placed.size : "small";
            const sizeClass =
              placed.size === "wide"
                ? "sm:col-span-2 xl:col-span-4"
                : placed.size === "medium"
                  ? "sm:col-span-2 xl:col-span-2"
                  : "";

            const card = <Component size={effectiveSize} />;

            return (
              <li
                key={placed.id}
                className={cn(
                  "col-span-1 flex min-w-0",
                  sizeClass,
                  editing && "relative",
                  draggingId === placed.id && "opacity-40",
                  overId === placed.id &&
                    draggingId !== placed.id &&
                    "[&>*]:-outline-offset-2 [&>*]:outline-2 [&>*]:outline-dashed [&>*]:outline-brass",
                )}
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
                  <div
                    className={cn(
                      "flex w-full min-w-0 flex-col overflow-hidden rounded-panel border",
                      "[&>*:last-child]:rounded-none [&>*:last-child]:border-0",
                      overId === placed.id && draggingId !== placed.id
                        ? "border-jade"
                        : "border-brass",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-1.5 border-b border-dashed border-rule bg-ink px-2.5 py-2">
                      {roomy ? (
                        <span
                          className="inline-flex min-h-[34px] min-w-[34px] cursor-pointer items-center justify-center rounded-chip border border-rule bg-panel-2 px-2 font-mono text-[12px] text-bone transition-[border-color,color] duration-[140ms] ease-tween enabled:hover:border-ash disabled:cursor-default disabled:opacity-35 cursor-grab text-ash active:cursor-grabbing"
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
                        className="inline-flex min-h-[34px] min-w-[34px] cursor-pointer items-center justify-center rounded-chip border border-rule bg-panel-2 px-2 font-mono text-[12px] text-bone transition-[border-color,color] duration-[140ms] ease-tween enabled:hover:border-ash disabled:cursor-default disabled:opacity-35"
                        disabled={index === 0}
                        aria-label={`Move ${definition.title} earlier`}
                        onClick={() => handleMove(definition, -1)}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-[34px] min-w-[34px] cursor-pointer items-center justify-center rounded-chip border border-rule bg-panel-2 px-2 font-mono text-[12px] text-bone transition-[border-color,color] duration-[140ms] ease-tween enabled:hover:border-ash disabled:cursor-default disabled:opacity-35"
                        disabled={index === layout.widgets.length - 1}
                        aria-label={`Move ${definition.title} later`}
                        onClick={() => handleMove(definition, 1)}
                      >
                        →
                      </button>

                      <button
                        type="button"
                        className="inline-flex min-h-[34px] min-w-[34px] cursor-pointer items-center justify-center rounded-chip border border-rule bg-panel-2 px-2 font-mono text-[12px] text-bone transition-[border-color,color] duration-[140ms] ease-tween enabled:hover:border-ash disabled:cursor-default disabled:opacity-35 tracking-[0.06em]"
                        aria-label={`${definition.title} size: ${SIZE_LABELS[placed.size]}. Change size.`}
                        onClick={() => handleCycleSize(definition, placed.size)}
                      >
                        {SIZE_LABELS[placed.size]}
                      </button>

                      <span className="flex-1" />

                      <button
                        type="button"
                        className="inline-flex min-h-[34px] min-w-[34px] cursor-pointer items-center justify-center rounded-chip border border-rule bg-panel-2 px-2 font-mono text-[12px] text-bone transition-[border-color,color] duration-[140ms] ease-tween enabled:hover:border-ash disabled:cursor-default disabled:opacity-35 hover:border-crimson hover:text-crimson"
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
                  <Link
                    href={definition.href}
                    className="flex w-full min-w-0 rounded-panel text-inherit no-underline [&:hover>*]:border-ash [&:hover>*]:bg-panel-2"
                  >
                    {card}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <section className="mt-[clamp(24px,3vw,44px)] border-t border-rule pt-[clamp(18px,2vw,28px)]" aria-label="Widgets you can add">
          <h2 className="m-0 font-display text-title font-medium">Add a card</h2>
          <p className="mx-0 mb-0 mt-1.5 text-base text-ash">
            {available.length === 0
              ? "Every card is already on your dashboard."
              : "These are not on your dashboard yet."}
          </p>

          {available.length > 0 ? (
            <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {available.map((definition) => (
                <li key={definition.id}>
                  <button
                    type="button"
                    className="flex w-full min-w-0 cursor-pointer flex-col gap-1 rounded-panel border border-dashed border-rule bg-panel p-3.5 text-left text-inherit transition-[border-color,background-color] duration-[140ms] ease-tween hover:border-jade hover:bg-panel-2"
                    onClick={() => handleAdd(definition)}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">{ownerLabel(definition.owner)}</span>
                    <span className="font-sans text-body font-semibold">{definition.title}</span>
                    <span className="text-sm text-ash">{definition.blurb}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
