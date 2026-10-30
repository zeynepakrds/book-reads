import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Pencil, Sparkles, Target, Trophy } from "lucide-react";
import { BadgeMedal } from "@/components/BadgeMedal";
import { LogoMark } from "@/components/Logo";
import { MyAvatar, MyName } from "@/components/MyAvatar";
import { Reveal } from "@/components/Reveal";
import { XpBar } from "@/components/XpBar";
import { btnPrimary, btnSecondary, card, container } from "@/components/ui";
import { badges } from "@/lib/data/badges";
import { getCurrentAccount } from "@/lib/server/users";
import { levelInfo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profilim",
  description: "Seviyen, rozetlerin ve ilerlemen.",
};

function GuestProfile() {
  return (
    <div className={`${container} py-16`}>
      <div className="bg-hero mx-auto flex max-w-2xl flex-col items-center rounded-[36px] border border-line px-6 py-14 text-center">
        <LogoMark className="anim-bob h-24 w-20" />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Burası senin rafın olacak</h1>
        <p className="mt-3 max-w-md font-reading text-lg leading-8 text-ink-soft">
          Üye olunca seviyen, serin ve kazandığın rozetler burada birikir. Hepsi hesabında güvende durur.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/uye-ol?sonra=%2Fprofil" className={btnPrimary}>
            <Sparkles size={18} aria-hidden /> Üye ol
          </Link>
          <Link href="/giris?sonra=%2Fprofil" className={btnSecondary}>
            Giriş yap
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const account = await getCurrentAccount();
  if (!account) return <GuestProfile />;

  const { level, into, needed, pct } = levelInfo(account.xp);
  const owned = new Set(account.badges);
  const myBadges = badges.map((b) => ({ ...b, earned: owned.has(b.id) }));
  const earned = myBadges.filter((b) => b.earned).length;
  const since = new Date(account.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  const stats = [
    { label: "meydan okuma bitirdin", value: account.quizzesCompleted, Icon: Target, tone: "#ff8a3d" },
    { label: "XP bu hafta", value: account.weeklyXp, Icon: Trophy, tone: "#d99a0b" },
    { label: "günlük seri", value: account.streak, Icon: Flame, tone: "#f0476f" },
  ];

  return (
    <div className={`${container} py-12 sm:py-16`}>
      <div className="bg-hero relative overflow-hidden rounded-[36px] border border-line p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-6">
          <MyAvatar size={96} className="ring-4 ring-card" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-soft">
              Seviye {level} okur · @{account.username} · {since}&apos;den beri üye
            </p>
            <h1 className="truncate text-4xl font-extrabold tracking-tight sm:text-5xl">
              <MyName />
            </h1>
          </div>
          <Link href="/ayarlar" className={btnSecondary}>
            <Pencil size={16} aria-hidden /> Profili düzenle
          </Link>
        </div>

        <div className="mt-8 max-w-xl">
          <XpBar pct={pct} />
          <p className="mt-2 text-sm font-semibold tabular-nums text-ink-soft">
            Toplam {account.xp.toLocaleString("tr-TR")} XP · sonraki seviyeye {needed - into} XP kaldı
          </p>
        </div>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, Icon, tone }, i) => (
          <Reveal as="li" key={label} delay={i * 0.08}>
            <div className={`${card} flex items-center gap-4 p-5`}>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: tone }} aria-hidden>
                <Icon size={22} />
              </span>
              <p>
                <span className="block text-3xl font-extrabold tabular-nums">{value.toLocaleString("tr-TR")}</span>
                <span className="text-sm font-semibold text-ink-soft">{label}</span>
              </p>
            </div>
          </Reveal>
        ))}
      </ul>

      {account.quizzesCompleted === 0 && (
        <div className={`${card} mt-6 flex flex-wrap items-center justify-between gap-4 p-6`}>
          <p className="font-semibold">İlk meydan okumanı çöz, ilk rozetin hemen gelsin!</p>
          <Link href="/meydan-okuma" className={btnPrimary}>
            Bir kitap seç
          </Link>
        </div>
      )}

      <section className="mt-16" aria-labelledby="rozetler">
        <h2 id="rozetler" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Rozetler
          <span className="ml-3 rounded-full bg-gold/25 px-3 py-1 align-middle text-base font-bold">
            {earned} / {badges.length}
          </span>
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {myBadges.map((b, i) => (
            <Reveal as="li" key={b.id} delay={Math.min(i, 8) * 0.04}>
              <div className={`${card} group flex h-full flex-col items-start gap-3 p-4`}>
                <span className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <BadgeMedal badge={b} size={64} />
                </span>
                <div>
                  <p className="font-bold">{b.name}</p>
                  <p className="text-sm leading-5 text-ink-soft">{b.hint}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>
    </div>
  );
}
