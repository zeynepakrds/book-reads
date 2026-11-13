"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, LogOut, Settings, UserRound, Users } from "lucide-react";
import { logoutUser } from "@/app/(auth)/actions";
import { MyAvatar, MyName } from "@/components/MyAvatar";
import { useSettings } from "@/components/SettingsProvider";
import { ThemeSegment } from "@/components/ThemeToggle";
import { cn, levelInfo } from "@/lib/utils";

/** Çıkış: oturum sunucuda silinir, sonra sayfa baştan yüklenir. */
export function useLogout() {
  const [pending, start] = useTransition();
  const logout = () =>
    start(async () => {
      try {
        await logoutUser();
      } finally {
        window.location.assign("/");
      }
    });
  return { logout, pending };
}

/** Navbar'daki profil düğmesi ve açılır menüsü (sadece üyeler için). */
export function UserMenu() {
  const { account } = useSettings();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const { logout, pending } = useLogout();

  useEffect(() => setOpen(false), [pathname]);

  // Dışarı tıklayınca ya da Esc'e basınca kapan.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!account) return null;
  const { level } = levelInfo(account.xp);

  const items = [
    { href: "/profil", label: "Profilim", Icon: UserRound },
    { href: "/arkadaslar", label: "Arkadaşlarım", Icon: Users },
    { href: "/ayarlar", label: "Ayarlar", Icon: Settings },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Profil menüsü"
        className={cn(
          "group flex items-center gap-1.5 rounded-full border-2 bg-card p-0.5 pr-2 transition",
          open ? "border-cobalt" : "border-line hover:border-ink/25",
        )}
      >
        <MyAvatar size={34} className="transition-transform duration-200 group-hover:scale-105" />
        <ChevronDown
          size={16}
          aria-hidden
          className={cn("text-ink-soft transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 rounded-3xl border border-line bg-card p-2 shadow-[0_24px_48px_-20px_rgb(var(--shadow)/0.45)]"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-wall/70 p-3">
              <MyAvatar size={44} />
              <div className="min-w-0">
                <p className="truncate font-bold">
                  <MyName />
                </p>
                <p className="truncate text-sm text-ink-soft">
                  @{account.username} · Seviye {level}
                </p>
              </div>
            </div>

            <ul className="mt-2 space-y-0.5">
              {items.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={pathname === href ? "page" : undefined}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition-colors hover:bg-wall"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-cobalt/12 text-cobalt">
                      <Icon size={17} aria-hidden />
                    </span>
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={logout}
                  disabled={pending}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold text-rose transition-colors hover:bg-rose/10 disabled:opacity-60"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose/12">
                    <LogOut size={17} aria-hidden />
                  </span>
                  {pending ? "Çıkılıyor..." : "Çıkış yap"}
                </button>
              </li>
            </ul>

            <div className="mt-2 border-t border-line px-1 pb-1 pt-3">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Tema</p>
              <ThemeSegment layoutId="menu-tema" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
