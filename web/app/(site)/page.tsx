import Link from "next/link";
import { BookOpen, Sparkles, Swords, Target } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BadgeMedal } from "@/components/BadgeMedal";
import { Bookshelf } from "@/components/Bookshelf";
import { CategoryList } from "@/components/CategoryList";
import { DuelPreview } from "@/components/DuelPreview";
import { HeroIllustration } from "@/components/HeroIllustration";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { btnOnDark, btnPrimary, btnSecondary, card, container } from "@/components/ui";
import { badges } from "@/lib/data/badges";
import { getLeaderboardPlayers } from "@/lib/server/users";
import { getBooks, getQuestionCounts } from "@/lib/server/content";

const steps = [
  {
    Icon: BookOpen,
    tone: "#13a08f",
    title: "Oku",
    text: "Her kitabın 2-4 dakikalık özeti ve ana fikirleri var. Kahveni al, başla.",
  },
  {
    Icon: Target,
    tone: "#ff8a3d",
    title: "Kendini sına",
    text: "Kısa sorularla ne kadar hatırladığına bak. Hızlı cevap, daha çok puan.",
  },
  {
    Icon: Swords,
    tone: "#f0476f",
    title: "Düello at",
    text: "Bir rakip bul, aynı sorulara aynı anda cevap verin. Kazanan rozeti kapar.",
  },
];

const medalColors = ["#ffbe3d", "#c9c2e8", "#f3b78a"];

export default async function HomePage() {
  const [books, counts, players] = await Promise.all([getBooks(), getQuestionCounts(), getLeaderboardPlayers()]);
  const questionTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = [...players].sort((a, b) => b.weeklyXp - a.weeklyXp).slice(0, 5);

  return (
    <>
      {/* ---------- Karşılama ---------- */}
      <section className={`${container} pt-6 sm:pt-10`}>
        <div className="bg-hero relative overflow-hidden rounded-[36px] border border-line px-6 pb-4 pt-10 sm:px-12 sm:pt-14 lg:pb-10">
          <div className="grid items-center gap-6 lg:grid-cols-[1.05fr_1fr]">
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3.5 py-1.5 text-sm font-bold text-ink shadow-[0_2px_0_0_var(--line)] ring-1 ring-line">
                <Sparkles size={15} className="text-gold" aria-hidden /> Selam okur, hoş geldin!
              </p>
              <h1 className="mt-6 text-balance text-[2.7rem] font-extrabold leading-[1] tracking-tight sm:text-6xl lg:text-[4.2rem]">
                Okuduğunu ne kadar{" "}
                <span className="relative inline-block whitespace-nowrap">
                  hatırlıyorsun
                  <svg
                    viewBox="0 0 300 20"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 h-3 w-full text-gold sm:-bottom-3 sm:h-4"
                    aria-hidden
                  >
                    <path d="M3 14 Q 40 3 75 11 T 150 10 T 225 9 T 297 7" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </span>
                ?
              </h1>
              <p className="mt-7 max-w-md font-reading text-lg leading-8 text-ink-soft">
                Kısa özetleri oku, sohbete katıl, sorularla kendini dene. Canın sıkılınca bir arkadaşına düello at: aynı sorular, aynı anda!
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/meydan-okuma" className={btnPrimary}>
                  Hadi başlayalım
                </Link>
                <Link href="/kitaplar" className={btnSecondary}>
                  Kitaplara göz at
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-2 text-sm font-semibold">
                {[
                  { label: `${books.length} kitap özeti`, dot: "bg-teal" },
                  { label: `${questionTotal} soru`, dot: "bg-tang" },
                  { label: "Her hafta yeni sıralama", dot: "bg-rose" },
                ].map((s) => (
                  <li key={s.label} className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1.5 ring-1 ring-line">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
                    {s.label}
                  </li>
                ))}
              </ul>
            </div>

            <HeroIllustration className="mx-auto w-full max-w-[520px]" />
          </div>
        </div>
      </section>

      {/* ---------- Nasıl oynanır ---------- */}
      <section className={`${container} mt-24`} aria-labelledby="nasil">
        <Reveal>
          <h2 id="nasil" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Üç adımda Ayraç
          </h2>
        </Reveal>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(({ Icon, tone, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 0.1}>
              <div className={`${card} group relative h-full overflow-hidden p-6 transition duration-300 hover:-translate-y-1`}>
                <span
                  className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-15 transition-transform duration-500 group-hover:scale-125"
                  style={{ backgroundColor: tone }}
                  aria-hidden
                />
                <span className="flex items-center gap-3">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:-rotate-12"
                    style={{ backgroundColor: tone }}
                    aria-hidden
                  >
                    <Icon size={24} />
                  </span>
                  <span className="text-sm font-bold text-ink-soft">{i + 1}. adım</span>
                </span>
                <h3 className="mt-5 text-2xl font-extrabold tracking-tight">{title}</h3>
                <p className="mt-2 font-reading text-[16px] leading-7 text-ink-soft">{text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------- Raf ve kategoriler ---------- */}
      <section className={`${container} mt-24`}>
        <Reveal>
          <SectionHeading
            title="Raftan bir kitap çek"
            text="Ne okumak istediğine karar veremedin mi? Rafa bak ya da bir kategoriden başla."
            action={{ href: "/kitaplar", label: "Tüm kitaplar" }}
          />
        </Reveal>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <Bookshelf books={books} />
          <Reveal delay={0.1}>
            <CategoryList books={books} />
          </Reveal>
        </div>
      </section>

      {/* ---------- Düello ---------- */}
      <section className={`${container} mt-28`}>
        <Reveal>
          <div className="on-dark relative grid gap-10 overflow-hidden rounded-[36px] bg-arena p-8 text-white sm:p-12 lg:grid-cols-2 lg:items-center">
            <span className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cobalt/30 blur-3xl" aria-hidden />
            <span className="absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-rose/25 blur-3xl" aria-hidden />
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-gold">
                <Swords size={15} aria-hidden /> Düello modu
              </p>
              <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
                İki oyuncu, aynı sorular, aynı anda.
              </h2>
              <p className="mt-5 max-w-md font-reading text-lg leading-8 text-white/75">
                Bir kitap seç, rakibini bul. Doğru cevap puan getirir, hızlı doğru cevap daha da fazlasını. Kazandıkça rozetler açılır.
              </p>
              <div className="mt-8">
                <Link href="/duello" className={btnOnDark}>
                  Düelloya gir
                </Link>
              </div>
            </div>
            <div className="relative">
              <DuelPreview />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- Sıralama ve rozetler ---------- */}
      <section className={`${container} mt-28`}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className={`${card} p-6 sm:p-8`}>
            <SectionHeading title="Haftanın zirvesi" action={{ href: "/siralama", label: "Tüm sıralama" }} />
            <ol className="mt-6 space-y-2">
              {top.map((p, i) => (
                <li key={p.id} className="flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-colors hover:bg-wall/70">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold tabular-nums"
                    style={i < 3 ? { backgroundColor: medalColors[i], color: "#26213f" } : undefined}
                  >
                    {i + 1}
                  </span>
                  <Avatar name={p.name} color={p.color} icon={p.icon} size={40} />
                  <span className="flex-1 truncate font-bold">{p.name}</span>
                  <span className="font-semibold tabular-nums">{p.weeklyXp.toLocaleString("tr-TR")} XP</span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal className={`${card} p-6 sm:p-8`} delay={0.1}>
            <SectionHeading title="Toplanacak rozetler" action={{ href: "/profil", label: "Rozetlerim" }} />
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
              {badges.slice(0, 6).map((b) => (
                <li key={b.id} className="group flex flex-col items-start gap-3">
                  <span className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <BadgeMedal badge={{ ...b, earned: true }} size={56} />
                  </span>
                  <div>
                    <p className="font-bold">{b.name}</p>
                    <p className="text-sm leading-5 text-ink-soft">{b.hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
