import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Number of columns at lg breakpoint (all variants collapse to 1 col on mobile).
   * 2 → lg:grid-cols-2
   * 3 → lg:grid-cols-3  (default)
   * 4 → lg:grid-cols-4  (stats row)
   * "3md" → md:grid-cols-3 (shorter breakpoint for stats bars)
   */
  cols?: 2 | 3 | 4 | "3md";
  /** Gap between cells. Defaults to "md" (gap-5). */
  gap?: "sm" | "md" | "lg";
}

const COLS_MAP: Record<NonNullable<DashboardGridProps["cols"]>, string> = {
  2:    "lg:grid-cols-2",
  3:    "lg:grid-cols-3",
  4:    "lg:grid-cols-4",
  "3md": "md:grid-cols-3",
};

const GAP_MAP: Record<NonNullable<DashboardGridProps["gap"]>, string> = {
  sm: "gap-4",
  md: "gap-5",
  lg: "gap-6",
};

export function DashboardGrid({
  children,
  className,
  cols = 3,
  gap = "md",
}: DashboardGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1",
        COLS_MAP[cols],
        GAP_MAP[gap],
        className,
      )}
    >
      {children}
    </div>
  );
}
