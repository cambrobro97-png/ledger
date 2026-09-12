"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

type Variant = "solid" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: boolean;
}

export function Button({ variant = "solid", icon, className, ...props }: ButtonProps) {
  const classes = cn(
    styles.button,
    variant === "ghost" && styles.ghost,
    variant === "danger" && `${styles.ghost} ${styles.danger}`,
    icon && styles.icon,
    className,
  );

  return <button type="button" className={classes} {...props} />;
}
