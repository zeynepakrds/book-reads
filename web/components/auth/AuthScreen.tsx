"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { safeNext } from "@/lib/safe-redirect";
import { cn } from "@/lib/utils";
import { AuthMascot } from "./AuthMascot";
import { LoginForm, RegisterForm } from "./forms";
import { bubbleOf, MascotContext, moodOf, type AuthMode, type MascotInput } from "./mascot-state";

/**
 * Giriş / üye ol ekranı: açık bir kitap.
 * Sol sayfa: maskot ve konuşma balonu. Sağ sayfa: form.
 * Giriş ↔ Üye ol geçişinde sağ sayfa gerçekten çevrilir.
 */

const EASE = [0.45, 0.05, 0.25, 1] as const;
const FLIP_S = 0.8;

const flip = {
  enter: (dir: number) => (dir > 0 ? { rotateY: 0, zIndex: 1 } : { rotateY: -180, zIndex: 3 }),
  center: { rotateY: 0, transition: { duration: FLIP_S, ease: EASE }, transitionEnd: { zIndex: 1 } },
  exit: (dir: number) =>
    dir > 0
      ? { rotateY: -180, zIndex: 3, transition: { duration: FLIP_S, ease: EASE, zIndex: { duration: 0 } } }
      : { opacity: 0, zIndex: 0, transition: { duration: 0.01, delay: FLIP_S } },
};

function freshInput(mode: AuthMode): MascotInput {
  return {
    mode,
    focus: "none",
    text: "",
    passwordLength: 0,
    strength: mode === "uye-ol" ? 0 : null,
    showPassword: false,
    capsLock: false,
    status: "idle",
    errorKey: 0,
  };
}

const ribbons: { mode: AuthMode; href: string; label: string; color: string }[] = [
  { mode: "giris", href: "/giris", label: "Giriş", color: "#ff6b8b" },
  { mode: "uye-ol", href: "/uye-ol", label: "Üye ol", color: "#ffbe3d" },
];

export function AuthScreen() {
  const pathname = usePathname();
  const params = useSearchParams();
  const mode: AuthMode = pathname.startsWith("/uye-ol") ? "uye-ol" : "giris";
  const sonra = safeNext(params.get("sonra"));

  const [input, setInput] = useState<MascotInput>(() => freshInput(mode));
  const [errorFlash, setErrorFlash] = useState(false);
  const prevMode = useRef(mode);
  const dir = mode === "uye-ol" ? 1 : -1;

  const setMascot = useCallback((patch: Partial<MascotInput>) => setInput((s) => ({ ...s, ...patch })), []);

  // Sayfa çevrilince maskot da yeni sayfaya göre sıfırlanır.
  useEffect(() => {
    if (prevMode.current !== mode) {
      prevMode.current = mode;
      setInput(freshInput(mode));
    }
  }, [mode]);

  // Hata tepkisi kısa sürer, sonra normale döner.
  useEffect(() => {
    if (input.errorKey === 0) return;
    setErrorFlash(true);
    const t = setTimeout(() => setErrorFlash(false), 1800);
    return () => clearTimeout(t);
  }, [input.errorKey]);

  const mood = moodOf(input, errorFlash);
  const bubble = bubbleOf(input, mood);
  const qs = sonra !== "/" ? `?sonra=${encodeURIComponent(sonra)}` : "";

  return (
    <MascotContext.Provider value={setMascot}>
      <div className="relative mx-auto w-full max-w-5xl">
        {/* Ayraç sekmeleri: kitabın üstünden sarkan kurdeleler */}
        <nav aria-label="Giriş veya üyelik" className="absolute -top-3 right-8 z-20 flex gap-2 sm:right-14">
          {ribbons.map((r) => {
            const active = r.mode === mode;
            return (
              <Link
                key={r.mode}
                href={`${r.href}${qs}`}
                aria-current={active ? "page" : undefined}
                className="group relative block w-16 sm:w-20"
              >
                <motion.span
                  className="flex items-end justify-center pb-4 text-[13px] font-extrabold text-[#26213f] shadow-[0_6px_10px_-6px_rgb(0_0_0/0.4)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_86%,0_100%)]"
                  style={{ backgroundColor: r.color }}
                  initial={false}
                  animate={{ height: active ? 74 : 54 }}
                  whileHover={{ height: active ? 74 : 62 }}
                  transition={{ type: "spring", stiffness: 380, damping: 24 }}
                >
                  {r.label}
                </motion.span>
              </Link>
            );
          })}
        </nav>

        {/* Kapak */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="rounded-[36px] bg-cobalt p-2 shadow-[0_50px_90px_-45px_rgb(var(--shadow)/0.75)] sm:p-3"
          style={{ transformPerspective: 1600 }}
        >
          <div className="grid overflow-hidden rounded-[28px] lg:grid-cols-2">
            {/* Sol sayfa */}
            <section
              aria-label="Ayraç maskotu"
              className="relative flex min-h-[300px] flex-col bg-page px-6 pb-6 pt-8 sm:min-h-[380px] lg:min-h-[620px]"
              style={{ backgroundImage: "linear-gradient(to left, rgb(0 0 0 / 0.07), transparent 14%)" }}
            >
              <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden />
              <div className="relative z-10 min-h-[64px]" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={bubble}
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    className={cn(
                      "relative mx-auto w-fit max-w-[280px] rounded-3xl bg-card px-5 py-3 text-center text-[15px] font-bold shadow-[0_4px_0_0_var(--line)] ring-1 ring-line",
                      "after:absolute after:-bottom-2 after:left-1/2 after:h-4 after:w-4 after:-translate-x-1/2 after:rotate-45 after:bg-card after:shadow-[1px_1px_0_0_var(--line)]",
                    )}
                  >
                    {bubble}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="relative mx-auto -mt-2 w-full max-w-[380px] flex-1">
                <AuthMascot input={input} mood={mood} />
              </div>
              <p className="relative mt-2 text-center font-reading text-sm italic text-ink-soft" aria-hidden>
                — {mode === "giris" ? 12 : 14} —
              </p>
            </section>

            {/* Sağ sayfa: çevrilen sayfa */}
            <section className="relative bg-page-edge" style={{ perspective: 2200 }}>
              <div className="grid h-full [&>*]:[grid-area:1/1]">
                <AnimatePresence initial={false} custom={dir}>
                  <motion.div
                    key={mode}
                    custom={dir}
                    variants={flip}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="relative flex flex-col bg-page px-6 pb-8 pt-14 sm:px-10 lg:pt-16"
                    style={{
                      transformOrigin: "left center",
                      backfaceVisibility: "hidden",
                      backgroundImage: "linear-gradient(to right, rgb(0 0 0 / 0.08), transparent 12%)",
                    }}
                  >
                    <div className="mx-auto w-full max-w-md flex-1">
                      {mode === "giris" ? <LoginForm sonra={sonra} /> : <RegisterForm sonra={sonra} />}
                    </div>
                    <p className="mt-6 text-center font-reading text-sm italic text-ink-soft" aria-hidden>
                      — {mode === "giris" ? 13 : 15} —
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </MascotContext.Provider>
  );
}
