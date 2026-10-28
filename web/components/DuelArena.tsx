"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Swords } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { MyAvatar, MyName } from "@/components/MyAvatar";
import { PageHeader } from "@/components/PageHeader";
import { BookCover } from "@/components/BookCover";
import { QuizRunner } from "@/components/QuizRunner";
import { btnPrimary } from "@/components/ui";
import type { Book, Player, PublicQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

type Stage = "lobby" | "searching" | "found" | "playing";

type Props = {
  books: Book[];
  questionsByBook: Record<string, PublicQuestion[]>;
  opponents: Player[];
};

/**
 * Düello akışı: kitap seç → rakip ara → eşleşme → sorular.
 *
 * ŞİMDİLİK rakip simüle ediliyor (rastgele bir oyuncu seçiliyor, puanı
 * rastgele artıyor). Veritabanına geçince “rakip ara” adımı Supabase Realtime
 * ile gerçek bir eşleşme odasına bağlanacak.
 */
export function DuelArena({ books, questionsByBook, opponents }: Props) {
  const [stage, setStage] = useState<Stage>("lobby");
  const [slug, setSlug] = useState(books[0]?.slug ?? "");
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [count, setCount] = useState(3);
  const [round, setRound] = useState(0);

  const book = books.find((b) => b.slug === slug) ?? books[0];

  useEffect(() => {
    if (stage !== "searching") return;
    const t = setTimeout(() => {
      setOpponent(opponents[Math.floor(Math.random() * opponents.length)] ?? null);
      setCount(3);
      setStage("found");
    }, 2600);
    return () => clearTimeout(t);
  }, [stage, opponents]);

  useEffect(() => {
    if (stage !== "found") return;
    if (count <= 0) {
      setStage("playing");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [stage, count]);

  function backToLobby() {
    setStage("lobby");
    setOpponent(null);
    setRound((r) => r + 1);
  }

  const dark = stage !== "lobby";

  return (
    <div
      className={cn(
        "min-h-[calc(100vh-4rem)] transition-colors duration-500",
        dark ? "on-dark bg-arena text-white" : "bg-paper text-ink",
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
        {/* ---------- Lobi ---------- */}
        {stage === "lobby" && (
          <div className="mx-auto max-w-3xl">
            <PageHeader
              icon={Swords}
              tone="#f0476f"
              title="Düello"
              description="Bir kitap seç, rakibini bul. İkiniz de aynı soruları aynı anda cevaplarsınız; doğru ve hızlı cevap daha çok puan getirir."
            />

            <h2 className="mt-10 text-lg font-bold">Hangi kitap üzerine?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Kitap seç">
              {books.map((b) => {
                const selected = b.slug === slug;
                return (
                  <button
                    key={b.slug}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSlug(b.slug)}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border-2 p-3 pr-5 text-left transition",
                      selected ? "border-cobalt bg-card shadow-[0_4px_0_0_var(--cobalt)]" : "border-line bg-card hover:-translate-y-0.5 hover:border-ink/30",
                    )}
                  >
                    <span className="w-10 shrink-0" aria-hidden>
                      <BookCover book={b} size="xs" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{b.title}</span>
                      <span className="block truncate text-sm text-ink-soft">{b.author}</span>
                    </span>
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                        selected ? "border-cobalt bg-cobalt" : "border-line",
                      )}
                      aria-hidden
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="button" onClick={() => setStage("searching")} className={btnPrimary}>
                <Swords size={18} aria-hidden /> Rakip bul
              </button>
              <p className="text-sm text-ink-soft">Önizleme: rakip şimdilik bilgisayar tarafından oynanıyor.</p>
            </div>
          </div>
        )}

        {/* ---------- Rakip aranıyor ---------- */}
        {stage === "searching" && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-gold/70"
                  initial={{ scale: 0.4, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 2.1, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
                />
              ))}
              <MyAvatar size={72} />
            </div>
            <p className="mt-8 text-2xl font-bold" role="status">
              Rakip aranıyor
            </p>
            <p className="mt-2 text-white/70">{book?.title} üzerine bir rakip buluyoruz.</p>
            <button
              type="button"
              onClick={backToLobby}
              className="mt-8 text-sm font-semibold text-white/70 underline underline-offset-4 hover:text-white"
            >
              Vazgeç
            </button>
          </div>
        )}

        {/* ---------- Eşleşme bulundu ---------- */}
        {stage === "found" && opponent && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="flex items-center gap-6 sm:gap-12">
              <motion.div
                initial={{ x: -140, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
                className="flex flex-col items-center gap-3"
              >
                <MyAvatar size={92} className="ring-4 ring-white/15" />
                <p className="font-bold">
                  <MyName />
                </p>
              </motion.div>

              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.25 }}
                className="text-5xl font-extrabold text-gold"
              >
                VS
              </motion.span>

              <motion.div
                initial={{ x: 140, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
                className="flex flex-col items-center gap-3"
              >
                <Avatar name={opponent.name} color={opponent.color} icon={opponent.icon} size={92} className="ring-4 ring-white/15" />
                <p className="font-bold">{opponent.name}</p>
              </motion.div>
            </div>

            <p className="mt-10 text-white/70">{book?.title} düellosu başlıyor</p>
            <div className="relative mt-2 h-24" role="status" aria-live="polite">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={count}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="block text-7xl font-extrabold tabular-nums"
                >
                  {Math.max(count, 1)}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ---------- Oyun ---------- */}
        {stage === "playing" && opponent && book && (
          <QuizRunner
            key={round}
            book={book}
            questions={questionsByBook[book.slug] ?? []}
            opponent={{ name: opponent.name, color: opponent.color, icon: opponent.icon }}
            autoStart
            onExit={backToLobby}
          />
        )}
      </div>
    </div>
  );
}
