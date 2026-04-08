import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "xl" | "full";
}

const radii = {
  sm:   "rounded",
  md:   "rounded-xl",
  xl:   "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({ className, rounded = "xl" }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-gray-200/80", radii[rounded], className)} />
  );
}

// ─── Готовые скелетоны для конкретных блоков ─────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="px-4 md:px-0 pt-5 md:pt-8 pb-6">
      <div className="flex justify-between mb-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" rounded="full" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 flex flex-col gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-24" />
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LessonSkeleton() {
  return (
    <div className="px-4 md:px-0 pb-8">
      <Skeleton className="h-20 mb-5" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col">
          <Skeleton className="h-32 rounded-t-2xl rounded-b-none" />
          <Skeleton className="h-24 rounded-t-none rounded-b-2xl" />
        </div>
      ))}
    </div>
  );
}
