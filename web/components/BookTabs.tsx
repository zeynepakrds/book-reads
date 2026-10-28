"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Lightbulb, LogIn, Send } from "lucide-react";
import { postComment } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { MyAvatar, MyName } from "@/components/MyAvatar";
import { useSettings } from "@/components/SettingsProvider";
import type { Book, Comment } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const tabs = [
  { id: "ozet", label: "Özet" },
  { id: "fikirler", label: "Ana fikirler" },
  { id: "tartisma", label: "Sohbet" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const MAX_LENGTH = 500;
const ideaTones = ["#13a08f", "#ff8a3d", "#9b5cf6", "#f0476f"];

function Discussion({ bookSlug, initial }: { bookSlug: string; initial: Comment[] }) {
  const { account } = useSettings();
  const [comments, setComments] = useState<Comment[]>(initial);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function post(e: React.FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await postComment({ bookSlug, text: clean });
        if (res.ok) {
          setComments((c) => [res.comment, ...c]);
          setText("");
        } else {
          setError(res.error);
        }
      } catch {
        setError("Yorum gönderilemedi. Bağlantını kontrol edip tekrar dene.");
      }
    });
  }

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-2xl">
      {!account ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-dashed border-line bg-card p-5">
          <div>
            <p className="font-bold">Sohbete katılmak ister misin?</p>
            <p className="mt-0.5 text-sm text-ink-soft">Yorum yazmak için üye olman yeterli. Okumak herkese açık.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/giris?sonra=${encodeURIComponent(`/kitaplar/${bookSlug}`)}`}
              className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_var(--cobalt-deep)]"
            >
              <LogIn size={15} aria-hidden /> Giriş yap
            </Link>
            <Link href="/uye-ol" className="inline-flex items-center rounded-full border-2 border-line px-4 py-2 text-sm font-bold">
              Üye ol
            </Link>
          </div>
        </div>
      ) : (
      <form onSubmit={post} className="rounded-3xl border border-line bg-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <MyAvatar size={36} />
          <label htmlFor="yorum" className="text-[15px] font-semibold">
            <MyName />, bu kitap hakkında ne düşünüyorsun?
          </label>
        </div>
        <textarea
          id="yorum"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={3}
          placeholder="Sevdiğin bir bölümü, merak ettiğin bir şeyi yaz."
          className="mt-3 w-full resize-y rounded-2xl border-2 border-line bg-paper p-4 font-reading text-[16px] leading-7 transition-colors placeholder:text-ink-soft/70 focus:border-cobalt"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-soft">
            {text.length} / {MAX_LENGTH} ·{" "}
            <Link href="/ayarlar" className="font-semibold underline underline-offset-2 hover:text-link">
              Profilini düzenle
            </Link>
          </p>
          <button
            type="submit"
            disabled={!text.trim() || pending}
            className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_var(--cobalt-deep)] transition active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={15} aria-hidden /> {pending ? "Gönderiliyor..." : "Paylaş"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-rose/12 px-3 py-2 text-sm font-semibold text-rose">
            {error}
          </p>
        )}
      </form>
      )}

      {comments.length === 0 ? (
        <p className="mt-8 rounded-2xl border-2 border-dashed border-line p-6 text-center text-ink-soft">
          Henüz kimse yazmamış. İlk yorumu sen bırak!
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          <AnimatePresence initial={false}>
            {comments.map((c) => {
              const isLiked = liked.has(c.id);
              return (
                <motion.li
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  className="flex gap-4 rounded-3xl border border-line bg-card p-4 sm:p-5"
                >
                  <Avatar name={c.author} color={c.color} icon={c.icon} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px]">
                      <span className="font-bold">{c.author}</span>
                      <span className="ml-2 text-sm text-ink-soft" suppressHydrationWarning>
                        {timeAgo(c.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1.5 whitespace-pre-line break-words font-reading text-[17px] leading-7">{c.text}</p>
                    <button
                      type="button"
                      onClick={() => toggleLike(c.id)}
                      aria-pressed={isLiked}
                      aria-label={isLiked ? "Beğeniyi geri al" : "Beğen"}
                      className={cn(
                        "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold transition-colors",
                        isLiked ? "bg-rose/12 text-rose" : "text-ink-soft hover:bg-wall hover:text-ink",
                      )}
                    >
                      <motion.span
                        key={String(isLiked)}
                        initial={{ scale: isLiked ? 0.4 : 1 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 12 }}
                        className="inline-flex"
                      >
                        <Heart size={16} fill={isLiked ? "currentColor" : "none"} aria-hidden />
                      </motion.span>
                      {c.likes + (isLiked ? 1 : 0)}
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

export function BookTabs({ book, comments }: { book: Book; comments: Comment[] }) {
  const [tab, setTab] = useState<TabId>("ozet");

  return (
    <div>
      <div role="tablist" aria-label="Kitap bölümleri" className="inline-flex gap-1 rounded-full bg-wall p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative rounded-full px-4 py-2 text-[15px] font-bold transition-colors",
              tab === t.id ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-card shadow-[0_2px_0_0_var(--line)]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">
              {t.label}
              {t.id === "tartisma" && (
                <span className="ml-1.5 rounded-full bg-cobalt px-2 py-0.5 text-xs text-white">{comments.length}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="pt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "ozet" && (
              <div className="max-w-[62ch] space-y-5 font-reading text-[18px] leading-8">
                {book.summary.map((p, i) => (
                  <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.85] first-letter:text-cobalt" : undefined}>
                    {p}
                  </p>
                ))}
                <p className="rounded-2xl bg-wall/70 px-4 py-3 text-[15px] leading-7 text-ink-soft">
                  Bu özet kitabın olay örgüsünü ve temel çatışmasını anlatır; önemli sürprizleri açık etmez.
                </p>
              </div>
            )}

            {tab === "fikirler" && (
              <ul className="grid max-w-3xl gap-3 sm:grid-cols-2">
                {book.ideas.map((idea, i) => (
                  <motion.li
                    key={idea.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-3xl border border-line bg-card p-5"
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: ideaTones[i % ideaTones.length] }}
                      aria-hidden
                    >
                      <Lightbulb size={18} />
                    </span>
                    <p className="mt-3 text-lg font-bold">{idea.title}</p>
                    <p className="mt-1.5 font-reading text-[16px] leading-7 text-ink-soft">{idea.text}</p>
                  </motion.li>
                ))}
              </ul>
            )}

            {tab === "tartisma" && <Discussion bookSlug={book.slug} initial={comments} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
