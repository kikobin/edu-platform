import { cn } from "@/lib/utils";
import type { AvatarId } from "@/types";

export const AVATAR_COLORS: Record<AvatarId, string> = {
  // Free avatars — soft pastels
  avatar_1: "bg-blue-200",
  avatar_2: "bg-purple-200",
  avatar_3: "bg-pink-200",
  avatar_4: "bg-primary-light",
  avatar_5: "bg-orange-200",
  avatar_6: "bg-green-200",
  avatar_7: "bg-yellow-200",
  avatar_8: "bg-red-200",
  // Shop (premium) avatars — vibrant, matching shop card colors
  av_dragon:    "bg-emerald-500",
  av_eagle:     "bg-sky-500",
  av_robot:     "bg-slate-600",
  av_wizard:    "bg-violet-600",
  av_ninja:     "bg-zinc-800",
  av_astronaut: "bg-indigo-600",
};

export const AVATAR_EMOJI: Record<AvatarId, string> = {
  avatar_1: "🦊", avatar_2: "🐺", avatar_3: "🦄",
  avatar_4: "🐻", avatar_5: "🦁", avatar_6: "🐸",
  avatar_7: "🐼", avatar_8: "🦋",
  av_dragon:    "🐉",
  av_eagle:     "🦅",
  av_robot:     "🤖",
  av_wizard:    "🧙",
  av_ninja:     "🥷",
  av_astronaut: "👨‍🚀",
};

// Hex values for frame ring — used as box-shadow so no extra wrapper div needed
const FRAME_RING: Record<string, string> = {
  frame_gold: "#FACC15",
  frame_neon: "#B5ED18",
  frame_fire: "#EF4444",
  frame_ice:  "#06B6D4",
};

interface AvatarDisplayProps {
  avatarId: AvatarId;
  size?: "sm" | "md" | "lg";
  /** frameId from user.frameId — renders a colored ring when set */
  frameId?: string;
}

const sizes = {
  sm: "w-10 h-10 text-2xl rounded-xl",
  md: "w-14 h-14 text-3xl rounded-2xl",
  lg: "w-20 h-20 text-5xl rounded-2xl",
};

export function AvatarDisplay({ avatarId, size = "md", frameId }: AvatarDisplayProps) {
  const ringColor = frameId ? FRAME_RING[frameId] : undefined;
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        AVATAR_COLORS[avatarId],
        sizes[size],
      )}
      style={ringColor ? { boxShadow: `0 0 0 3px ${ringColor}, 0 0 0 5px ${ringColor}22` } : undefined}
    >
      {AVATAR_EMOJI[avatarId]}
    </div>
  );
}
