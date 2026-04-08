import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "success" | "muted";
  className?: string;
}

const variants = {
  primary: "bg-primary-light text-primary",
  accent:  "bg-accent text-text",
  success: "bg-green-100 text-success",
  muted:   "bg-gray-100 text-text-muted",
};

export function Badge({ children, variant = "primary", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
