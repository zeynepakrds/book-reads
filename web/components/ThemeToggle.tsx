"use client";

import { AnimatePresence, motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import type { ThemePref } from "@/lib/settings";
import { cn } from "@/lib/utils";

/** Navbar'daki tek tıkla açık/koyu geçiş düğmesi. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme, ready } = useSettings();
  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "acik" : "koyu")}
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      title={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-line bg-card text-ink transition hover:border-ink/25 hover:text-cobalt",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={ready ? resolvedTheme : "bos"}
          initial={{ y: 14, rotate: -60, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -14, rotate: 60, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="inline-flex"
        >
          {dark ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

const options: { id: ThemePref; label: string; Icon: typeof Sun }[] = [
  { id: "acik", label: "Açık", Icon: Sun },
  { id: "koyu", label: "Koyu", Icon: Moon },
  { id: "sistem", label: "Sistem", Icon: Monitor },
];

/** Üç seçenekli tema seçici (menüde ve ayarlarda). */
export function ThemeSegment({ layoutId = "tema-secici" }: { layoutId?: string }) {
  const { settings, setTheme } = useSettings();

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1 rounded-full bg-wall p-1">
      {options.map(({ id, label, Icon }) => {
        const active = settings.theme === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(id)}
            className={cn(
              "relative inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[13px] font-semibold transition-colors",
              active ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <Icon size={14} className="relative" aria-hidden />
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
