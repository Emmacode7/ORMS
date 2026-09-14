import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "px-3 py-1.5 text-sm",
    size === "md" && "px-4 py-2 text-sm",
    size === "lg" && "px-5 py-2.5 text-base",
    variant === "primary" && "bg-navy-700 text-white hover:bg-navy-800",
    variant === "secondary" &&
      "border border-line-300 bg-white text-ink-900 hover:bg-surface-muted",
    variant === "danger" && "bg-priority-urgent text-white hover:bg-red-800",
    variant === "ghost" && "text-ink-700 hover:bg-surface-muted"
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={cn(buttonClasses(variant, size), className)} {...props} />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonClasses(variant, size), className)}>
      {children}
    </Link>
  );
}
