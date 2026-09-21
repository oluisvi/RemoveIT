import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={clsx("button", `button-${variant}`, className)} {...props} />;
}
