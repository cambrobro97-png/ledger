"use client";

import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "solid" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: boolean;
}

export function Button({ variant = "solid", icon, className, ...props }: ButtonProps) {
  const classes = [
    styles.button,
    variant === "ghost" ? styles.ghost : "",
    variant === "danger" ? `${styles.ghost} ${styles.danger}` : "",
    icon ? styles.icon : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <button type="button" className={classes} {...props} />;
}
