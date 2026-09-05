"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { TOOLS, isToolActive } from "@/lib/tools";
import styles from "./ToolsMenu.module.css";

/**
 * Every tool behind one button.
 *
 * This is the W3C disclosure pattern rather than a `role="menu"` widget: the
 * panel holds ordinary links, so Tab walks them and the browser's own
 * open-in-new-tab affordances keep working.
 */
export function ToolsMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const current = TOOLS.find((tool) => isToolActive(tool, pathname));

  // Navigating closes the panel. Clicking the tool you are already on doesn't
  // change the path, so the links close it themselves as well.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      // Tabbing past the last link leaves the panel; close it behind us.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        Tools
        <span className={styles.chevron} aria-hidden="true" />
      </button>

      <div id={panelId} className={styles.panel} hidden={!open}>
        <ul className={styles.list}>
          {TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className={styles.item}
                aria-current={tool === current ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className={styles.name}>{tool.name}</span>
                <span className={styles.blurb}>{tool.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
