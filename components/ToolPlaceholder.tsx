import type { Tool } from "@/lib/tools";
import styles from "./ToolPlaceholder.module.css";

/** Stand-in for a tool that has a route and a tab but no implementation yet. */
export function ToolPlaceholder({ tool }: { tool: Tool }) {
  return (
    <main className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>Not built yet</div>
        <h1 className={styles.title}>{tool.name}</h1>
        <p className={styles.blurb}>{tool.blurb}</p>

        <section className={styles.panel}>
          <p className={styles.panelLabel}>Placeholder</p>
          <p className={styles.panelText}>
            This tool has a route and a tab so the shell is in place. The calculator itself still
            needs building.
          </p>
        </section>
      </div>
    </main>
  );
}
