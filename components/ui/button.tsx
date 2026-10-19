"use client";
import * as React from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-md rounded-[var(--radius)]",
  secondary:
    "bg-muted text-foreground hover:bg-border rounded-[var(--radius)]",
  outline:
    "border border-input bg-card text-foreground hover:bg-muted hover:border-muted-foreground/30 rounded-[var(--radius)]",
  ghost:
    "text-foreground hover:bg-muted rounded-[var(--radius-sm)]",
  danger:
    "bg-danger text-white hover:bg-red-600 shadow-sm rounded-[var(--radius)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-sm",
  md: "h-10 px-5 text-sm",
  icon: "h-9 w-9",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function DeleteButton({ label = "Delete", className }: { label?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={pending} className={className}>
      {pending ? "Deleting…" : label}
    </Button>
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
