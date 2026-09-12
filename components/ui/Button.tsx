"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "solid" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: boolean;
}

export function Button({ variant = "solid", icon, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      // Padding and background are picked rather than layered, so two utilities
      // for the same property never both ship and leave the cascade to settle it.
      className={cn(
        "cursor-pointer rounded-control border border-rule text-bone",
        "text-body font-medium leading-none transition-colors duration-150",
        "enabled:hover:border-ash disabled:cursor-default disabled:opacity-45",
        icon ? "px-3 py-[9px] font-mono" : "px-3.5 py-2.5 font-sans",
        variant === "solid" ? "bg-ink" : "bg-transparent",
        variant === "danger" && "enabled:hover:border-crimson enabled:hover:text-crimson",
        className,
      )}
      {...props}
    />
  );
}
