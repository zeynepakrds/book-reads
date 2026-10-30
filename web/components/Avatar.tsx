import { Bird, Cat, Dog, Fish, Panda, Rabbit, Squirrel, Turtle } from "lucide-react";
import type { AvatarIcon } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

const icons = {
  kedi: Cat,
  kopek: Dog,
  tavsan: Rabbit,
  sincap: Squirrel,
  kus: Bird,
  balik: Fish,
  kaplumbaga: Turtle,
  panda: Panda,
} as const;

export function Avatar({
  name,
  color,
  icon,
  size = 40,
  className,
}: {
  name: string;
  color: string;
  icon?: AvatarIcon;
  size?: number;
  className?: string;
}) {
  const Icon = icon && icon !== "harf" ? icons[icon] : null;

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 25%, color-mix(in srgb, ${color} 70%, white), ${color} 70%)`,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {Icon ? <Icon size={Math.round(size * 0.56)} strokeWidth={2} /> : initials(name)}
    </span>
  );
}
