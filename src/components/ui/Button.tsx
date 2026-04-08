"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  fullWidth?: boolean;
  loading?:  boolean;
  icon?:     React.ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-md select-none " +
  "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "active:scale-[0.97] disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-primary/20 hover:shadow-primary " +
    "disabled:bg-locked disabled:text-text-muted disabled:shadow-none focus-visible:ring-primary",
  secondary:
    "bg-primary-light text-primary hover:bg-primary-light/70 " +
    "disabled:opacity-40 focus-visible:ring-primary",
  ghost:
    "bg-transparent text-text-muted hover:bg-gray-100 hover:text-text focus-visible:ring-gray-400",
  accent:
    "bg-accent text-dark font-bold hover:bg-accent-hover shadow-accent/20 hover:shadow-accent " +
    "focus-visible:ring-accent",
  danger:
    "bg-error-light text-error hover:bg-red-100 focus-visible:ring-error",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2   text-sm  min-h-[36px] rounded-md",
  md: "px-5 py-2.5 text-sm  min-h-[44px] rounded-md",
  lg: "px-6 py-3   text-base min-h-[52px] rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, loading, icon, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-[2px] border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
);

Button.displayName = "Button";
