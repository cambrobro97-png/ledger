import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The page shell every tool sits in.
 *
 * The four tool pages each carried their own copy of this: `tool-page.module.css`
 * and both `page.module.css` files defined the same `.wrap` and `.footnote`, and
 * the mortgage and retirement modules were byte-identical to each other across
 * all 44 lines.
 */
export function ToolPage({
  children,
  presenting,
}: {
  children: ReactNode;
  presenting?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto max-w-[1800px] px-(--pad) pb-16",
        // Top padding is tighter than the sides: the site tab bar already sits
        // above. Presenting drops the bar, so the page needs its own room.
        presenting ? "pt-[clamp(20px,2vw,36px)]" : "pt-[clamp(14px,1.6vw,28px)]",
      )}
    >
      {children}
    </main>
  );
}

export function ToolFootnote({ children }: { children: ReactNode }) {
  return <p className="mt-[34px] max-w-[80ch] text-sm text-ash">{children}</p>;
}

/** A model error, in the tool's own voice rather than a browser's. */
export function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="mt-[18px] rounded-[10px] border border-crimson/45 bg-crimson/12 px-4 py-3.5 text-body text-[#ffc9cd]">
      {children}
    </p>
  );
}
