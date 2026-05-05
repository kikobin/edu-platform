"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  compact?: boolean;
  withTagline?: boolean;
  className?: string;
};

export function Logo({ compact = false, withTagline = false, className }: LogoProps) {
  const width = compact ? 96 : 132;
  const height = compact ? 26 : 36;
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      {failed ? (
        <span
          className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-primary text-white text-[12px] font-bold tracking-tight"
          style={{ height }}
        >
          AI Trend
        </span>
      ) : (
        <Image
          src="/logo.png"
          alt="AI Trend"
          width={width}
          height={height}
          priority
          onError={() => setFailed(true)}
          className="h-auto w-auto max-w-full"
        />
      )}
      {withTagline && (
        <span className="hidden xl:inline text-[11px] text-text-muted leading-tight truncate">
          готовим к новому будущему
        </span>
      )}
    </div>
  );
}
