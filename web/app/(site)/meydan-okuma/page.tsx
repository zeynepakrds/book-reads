import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, Target } from "lucide-react";
import { BookCover } from "@/components/BookCover";
import { Difficulty } from "@/components/Difficulty";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { btnPrimary, btnSecondary, container } from "@/components/ui";
import { getBooks, getQuestionCounts } from "@/lib/server/content";
import { getCurrentUser } from "@/lib/server/users";

export const metadata: Metadata = {
  title: "Meydan okuma",
  description: "Kitabı ne kadar hatırlıyorsun? Soruları çöz, puan topla, rozet kazan.",
};

export default async function ChallengesPage() {
  const [books, counts, user] = await Promise.all([getBooks(), getQuestionCounts(), getCurrentUser()]);

  return (
    <div className={`${container} py-12 sm:py-16`}>
      <PageHeader
        icon={Target}
        tone="#ff8a3d"
        title="Meydan okuma"
        description="Bir kitap seç, sorularını çöz. Doğru ve hızlı cevaplar daha çok puan getirir; kusursuz bir tur rozet kazandırır."
      />

      {!user && (
        <div className="bg-hero mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[28px] border border-line p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-cobalt ring-1 ring-line" aria-hidden>
              <Lock size={22} />
            </span>
            <div>
              <p className="text-xl font-extrabold tracking-tight">Meydan okumalar üyelere özel</p>
              <p className="mt-1 max-w-md text-ink-soft">Puanların, serin ve rozetlerin kaybolmasın diye hesabına kaydediyoruz. Üye olmak bir dakika sürer.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/uye-ol?sonra=%2Fmeydan-okuma" className={btnPrimary}>
              Üye ol
            </Link>
            <Link href="/giris?sonra=%2Fmeydan-okuma" className={btnSecondary}>
              Giriş yap
            </Link>
          </div>
        </div>
      )}

      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {books.map((b, i) => {
          const count = counts[b.slug] ?? 0;
          return (
            <Reveal as="li" key={b.slug} delay={Math.min(i, 6) * 0.04}>
              <Link
                href={`/meydan-okuma/${b.slug}`}
                className="group flex h-full items-center gap-5 rounded-3xl border border-line bg-card p-4 transition duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_14px_30px_-18px_rgb(var(--shadow)/0.5)]"
              >
                <div className="w-14 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                  <BookCover book={b} size="xs" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold">{b.title}</p>
                  <p className="truncate text-sm text-ink-soft">{b.author}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-sm font-semibold text-ink-soft">{count} soru</span>
                    <Difficulty level={b.difficulty} />
                  </div>
                </div>
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition duration-300 group-hover:bg-cobalt group-hover:text-white"
                  aria-hidden
                >
                  {user ? (
                    <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  ) : (
                    <Lock size={16} />
                  )}
                </span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}
