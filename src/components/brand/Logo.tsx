import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  compact?: boolean;
  withTagline?: boolean;
  className?: string;
};

export function Logo({ compact = false, className }: LogoProps) {
  const width = compact ? 96 : 144;
  const height = compact ? 26 : 40;
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="AI Trend — готовим к новому будущему"
        width={width}
        height={height}
        priority
      />
    </div>
  );
}
