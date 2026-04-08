import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /**
   * "default" — standard student page (px-4 mobile gutter, pt-6 pb-10, space-y-6)
   * "wide"    — same but no max-width constraint (used inside AppLayout wide)
   * "flush"   — no padding, no spacing (custom layouts control their own spacing)
   */
  variant?: "default" | "wide" | "flush";
}

export function PageContainer({ children, className, variant = "default" }: PageContainerProps) {
  return (
    <div
      className={cn(
        variant !== "flush" && "px-4 md:px-0 pt-6 pb-10 space-y-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
