"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  color?: "primary" | "accent" | "success";
  size?:  "xs" | "sm" | "md";
  label?: string;
  className?: string;
}

const colors = {
  primary: "bg-primary",
  accent:  "bg-accent",
  success: "bg-success",
};

const tracks = {
  primary: "bg-primary-light",
  accent:  "bg-accent/20",
  success: "bg-success/15",
};

const heights = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
};

export function ProgressBar({ value, color = "primary", size = "md", label, className }: ProgressBarProps) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full rounded-full overflow-hidden", tracks[color], heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colors[color])}
          style={{ width: `${v}%` }}
        />
      </div>
      {label !== undefined && (
        <div className="flex justify-between mt-1">
          <span className="text-2xs text-text-muted">{label}</span>
          <span className="text-2xs font-bold text-text-muted">{v}%</span>
        </div>
      )}
    </div>
  );
}
