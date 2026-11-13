"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, LogIn, LogOut, Menu, Settings, Swords, Target, Trophy, UserRound, Users, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MyAvatar, MyName } from "@/components/MyAvatar";
import { ThemeSegment, ThemeToggle } from "@/components/ThemeToggle";
import { useSettings } from "@/components/SettingsProvider";
import { useLogout, UserMenu } from "@/components/UserMenu";
import { cn, levelInfo } from "@/lib/utils";

const links = [
  { href: "/kitaplar", label: "Kitaplar", Icon: BookOpen, tone: "text-teal" },
  { href: "/meydan-okuma", label: "Meydan okuma", Icon: Target, tone: "text-tang" },
  { href: "/duello", label: "Düello", Icon: Swords, tone: "text-rose" },
  { href: "/siralama", label: "Sıralama", Icon: Trophy, tone: "text-gold" },
  { href: "/arkadaslar", label: "Arkadaşlar", Icon: Users, tone: "text-teal" },
];

export function Navbar() {
  const pathname = usePathname();
  const { account } = useSettings();
  const { logout, pending } = useLogout();
  const loginHref = pathname === "/" ? "/giris" : `/giris?sonra=${encodeURIComponent(pathname)}`;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300",
        scrolled ? "border-line bg-paper/85" : "border-transparent bg-paper/60",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Logo />

        <nav aria-label="Ana menü" className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label, Icon, tone }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] font-semibold transition-colors",
                  active ? "text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-card shadow-[0_2px_0_0_var(--line)] ring-1 ring-line"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={16}
                  aria-hidden
                  className={cn(
                    "relative transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110",
                    active ? tone : "",
                  )}
                />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {account ? (
            <div className="hidden md:block">
              <UserMenu />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href={loginHref} className="rounded-full px-4 py-2 text-[15px] font-bold text-ink transition-colors hover:bg-card">
                Giriş yap
              </Link>
              <Link
                href="/uye-ol"
                className="rounded-full bg-cobalt px-4 py-2 text-[15px] font-bold text-white shadow-[0_3px_0_0_var(--cobalt-deep)] transition hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none"
              >
                Üye ol
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobil-menu"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-card md:hidden"
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="mobil-menu"
            aria-label="Mobil menü"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-line bg-paper md:hidden"
          >
            <div className="mx-auto max-w-6xl px-5 py-4">
              {account ? (
                <Link href="/profil" className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line">
                  <MyAvatar size={44} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      <MyName />
                    </span>
                    <span className="text-sm text-ink-soft">
                      Seviye {levelInfo(account.xp).level} · {account.xp.toLocaleString("tr-TR")} XP
                    </span>
                  </span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href={loginHref} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-line bg-card px-3 py-3 font-bold">
                    <LogIn size={18} aria-hidden /> Giriş yap
                  </Link>
                  <Link href="/uye-ol" className="flex items-center justify-center rounded-2xl bg-cobalt px-3 py-3 font-bold text-white">
                    Üye ol
                  </Link>
                </div>
              )}
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {[...links, { href: "/profil", label: "Profilim", Icon: UserRound, tone: "text-cobalt" }, { href: "/ayarlar", label: "Ayarlar", Icon: Settings, tone: "text-plum" }].map(
                  ({ href, label, Icon, tone }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={pathname.startsWith(href) ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-2xl border-2 px-3 py-3 font-semibold",
                          pathname.startsWith(href) ? "border-cobalt bg-card" : "border-line",
                        )}
                      >
                        <Icon size={18} className={tone} aria-hidden />
                        {label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
              <div className="mt-4">
                <ThemeSegment layoutId="mobil-tema" />
              </div>
              {account && (
                <button
                  type="button"
                  onClick={logout}
                  disabled={pending}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-line py-3 font-bold text-rose"
                >
                  <LogOut size={18} aria-hidden /> {pending ? "Çıkılıyor..." : "Çıkış yap"}
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
