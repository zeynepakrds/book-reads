import { cn } from "@/lib/utils";

const labels = ["Kolay", "Orta", "Zor"] as const;

export function Difficulty({ level, className }: { level: 1 | 2 | 3; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-sm text-ink-soft", className)}
      title={`Zorluk: ${labels[level - 1]}`}
    >
      <span className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("h-2 w-2 rounded-full", i <= level ? "bg-ink" : "bg-line")}
          />
        ))}
      </span>
      <span>{labels[level - 1]}</span>
    </span>
  );
}
