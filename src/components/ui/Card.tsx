import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "bordered" | "flat" | "dark";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?:  CardVariant;
  padded?:   boolean;
  hoverable?: boolean;
}

const variants: Record<CardVariant, string> = {
  default:  "bg-white shadow-card border border-border",
  bordered: "bg-white border-2 border-border",
  flat:     "bg-white border border-border",
  dark:     "bg-dark text-white border border-white/5",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padded = true, hoverable, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl",
        variants[variant],
        padded && "p-5",
        hoverable && "transition-all duration-200 hover:shadow-card-md hover:border-primary/20 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = "Card";
