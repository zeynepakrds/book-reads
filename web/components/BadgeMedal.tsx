import {
  BookOpen,
  Compass,
  Flame,
  Library,
  Lock,
  MessageCircle,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { Badge } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons = {
  BookOpen,
  Target,
  Zap,
  Library,
  Swords,
  Trophy,
  Compass,
  MessageCircle,
  Flame,
} as const;

export function BadgeMedal({ badge, size = 64 }: { badge: Badge; size?: number }) {
  const Icon = icons[badge.icon];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        !badge.earned && "opacity-45 grayscale",
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${badge.tone}, color-mix(in srgb, ${badge.tone} 62%, #000))`,
        boxShadow: badge.earned ? `0 12px 20px -10px ${badge.tone}` : "none",
      }}
    >
      <span className="absolute inset-[7%] rounded-full border-2 border-white/40" />
      <Icon size={Math.round(size * 0.44)} strokeWidth={2.2} className="relative text-white" aria-hidden />
      {!badge.earned && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-arena p-1 text-white ring-2 ring-paper">
          <Lock size={12} aria-hidden />
        </span>
      )}
    </span>
  );
}
