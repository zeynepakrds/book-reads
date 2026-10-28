"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Crown, Flame } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useSettings } from "@/components/SettingsProvider";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";

type Period = "week" | "all";

const periods: { id: Period; label: string }[] = [
  { id: "week", label: "Bu hafta" },
  { id: "all", label: "Tüm zamanlar" },
];

// Kürsü sırası: 2. – 1. – 3.
const podium = [
  { rank: 2, height: "h-28", bar: "bg-[#c9c2e8]" },
  { rank: 1, height: "h-40", bar: "bg-[#ffbe3d]" },
  { rank: 3, height: "h-20", bar: "bg-[#f3b78a]" },
];

export function LeaderboardTable({ players, meId }: { players: Player[]; meId?: string }) {
  const [period, setPeriod] = useState<Period>("week");
  const { settings } = useSettings();
  // Ziyaretçinin kendi satırı Ayarlar'daki ad ve avatarla görünür.
  const withMe = useMemo(
    () => players.map((p) => (p.id === meId ? { ...p, name: settings.name, color: settings.color, icon: settings.icon } : p)),
    [players, meId, settings.name, settings.color, settings.icon],
  );

  const value = (p: Player) => (period === "week" ? p.weeklyXp : p.xp);

  const ranked = useMemo(
    () => [...withMe].sort((a, b) => (period === "week" ? b.weeklyXp - a.weeklyXp : b.xp - a.xp)),
    [withMe, period],
  );

  const rest = ranked.slice(3);

  return (
    <div>
      <div role="tablist" aria-label="Sıralama dönemi" className="inline-flex rounded-full bg-wall p-1 ring-1 ring-line">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            onClick={() => setPeriod(p.id)}
            className="relative rounded-full px-5 py-2 text-sm font-semibold"
          >
            {period === p.id && (
              <motion.span
                layoutId="period-pill"
                className="absolute inset-0 rounded-full bg-card shadow-[0_2px_0_0_var(--line)]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Kürsü */}
      <div key={period} className="mt-12 grid grid-cols-3 items-end gap-3 sm:gap-6">
        {podium.map(({ rank, height, bar }) => {
          const p = ranked[rank - 1];
          if (!p) return <div key={rank} />;
          return (
            <div key={rank} className="flex flex-col items-center text-center">
              <motion.span
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.5 + (rank === 1 ? 0.15 : rank === 2 ? 0 : 0.3) }}
                className="relative"
              >
                {rank === 1 && <Crown size={28} className="absolute -top-6 left-1/2 -translate-x-1/2 rotate-[-8deg] text-gold" fill="currentColor" aria-hidden />}
                <Avatar name={p.name} color={p.color} icon={p.icon} size={rank === 1 ? 72 : 56} className="ring-4 ring-paper" />
              </motion.span>
              <p className="mt-3 max-w-full truncate text-[15px] font-bold">{p.name}</p>
              <p className="text-sm tabular-nums text-ink-soft">{value(p).toLocaleString("tr-TR")} XP</p>
              <motion.div
                className={cn("mt-4 flex w-full origin-bottom items-start justify-center rounded-t-2xl pt-3", height, bar)}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: rank === 1 ? 0.25 : rank === 2 ? 0.1 : 0.4 }}
              >
                <span className="text-3xl font-extrabold text-[#26213f]">{rank}</span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Diğerleri */}
      <ol start={4} className="mt-2 overflow-hidden rounded-3xl border border-line bg-card">
        {rest.map((p, i) => {
          const isMe = p.id === meId;
          return (
            <motion.li
              key={p.id}
              layout
              transition={{ type: "spring", stiffness: 350, damping: 34 }}
              className={cn("flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-b-0 sm:px-5", isMe && "bg-cobalt/10")}
            >
              <span className="w-6 text-lg font-bold tabular-nums text-ink-soft">{i + 4}</span>
              <Avatar name={p.name} color={p.color} icon={p.icon} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {p.name}
                  {isMe && <span className="ml-2 rounded-full bg-cobalt px-2 py-0.5 text-xs font-bold text-white">Sen</span>}
                </p>
                <p className="inline-flex items-center gap-1 text-sm text-ink-soft">
                  <Flame size={14} className="text-tang" aria-hidden /> {p.streak} günlük seri
                </p>
              </div>
              <p className="font-bold tabular-nums">{value(p).toLocaleString("tr-TR")} XP</p>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
