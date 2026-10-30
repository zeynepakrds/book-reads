"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "motion/react";
import { Check, Clock, RotateCcw, Sparkles, X } from "lucide-react";
import { answerQuestion, nextQuestion, startQuiz } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { BadgeMedal } from "@/components/BadgeMedal";
import { BookCover } from "@/components/BookCover";
import { useSettings } from "@/components/SettingsProvider";
import { btnGhostOnDark, btnOnDark } from "@/components/ui";
import type { FinishSummary } from "@/lib/server/quiz";
import type { AnswerResult, AvatarIcon, Book, PublicQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

const SECONDS = 20;
const LETTERS = ["A", "B", "C", "D"];
const MAX_PER_QUESTION = 100 + SECONDS * 2;

type Phase = "intro" | "starting" | "playing" | "done";
type Opponent = { name: string; color: string; icon?: AvatarIcon };

type Props = {
  book: Book;
  questions: PublicQuestion[];
  /** Verilirse düello modu: rakibin puanı da gösterilir (rakip şimdilik simüle). */
  opponent?: Opponent;
  autoStart?: boolean;
  onExit?: () => void;
};

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [to]);
  return <>{n}</>;
}

function ScoreRow({
  name,
  color,
  icon,
  score,
  max,
}: {
  name: string;
  color: string;
  icon?: AvatarIcon;
  score: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} color={color} icon={icon} size={28} />
      <span className="w-28 shrink-0 truncate text-sm font-semibold">{name}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(100, (score / max) * 100)}%`, backgroundColor: color === "#26213f" ? "#8e93ff" : color }}
        />
      </div>
      <span className="w-12 text-right text-sm font-bold tabular-nums">{score}</span>
    </div>
  );
}

function goLogin() {
  window.location.assign(`/giris?sonra=${encodeURIComponent(window.location.pathname)}`);
}

/**
 * Tur SUNUCUDA yürür: başlarken sunucu bir tur açar, her cevabın puanını ve
 * süresini sunucu hesaplar, tur bitince XP ve rozetleri hesaba yazar. Buradaki
 * sayaç sadece ekranda gösterim içindir.
 */
export function QuizRunner({ book, questions: initialQuestions, opponent, autoStart = false, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>(autoStart ? "starting" : "intro");
  const [questions, setQuestions] = useState<PublicQuestion[]>(initialQuestions);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [gained, setGained] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [history, setHistory] = useState<boolean[]>([]);
  const { settings } = useSettings();
  const lastChoice = useRef(-1);

  const total = questions.length;
  const question = questions[index];
  const answered = result !== null;
  const maxScore = total * MAX_PER_QUESTION;

  const submit = useCallback(
    async (choice: number) => {
      if (busy || result || !question || !attemptId) return;
      lastChoice.current = choice;
      setBusy(true);
      setPicked(choice === -1 ? null : choice);
      setError(null);
      try {
        // Doğru cevap tarayıcıda yok: sunucuya sorulur, puanı da sunucu hesaplar.
        const res = await answerQuestion(attemptId, question.id, choice);
        if (!res.ok) {
          if ("needLogin" in res) return goLogin();
          setError(res.error);
          setPicked(null);
          return;
        }
        setResult({ correct: res.correct, correctIndex: res.correctIndex, explanation: res.explanation });
        setGained(res.points);
        setScore(res.score);
        setHistory((h) => [...h, res.correct]);
        if (res.correct) setCorrectCount((c) => c + 1);
        if (res.summary) setSummary(res.summary);
        if (opponent && Math.random() < 0.68) {
          setOppScore((s) => s + 100 + Math.round(Math.random() * 40));
        }
      } catch {
        setError("Cevap kontrol edilemedi. Bağlantını kontrol edip tekrar dene.");
        setPicked(null);
      } finally {
        setBusy(false);
      }
    },
    [busy, result, question, attemptId, opponent],
  );

  // Geri sayım
  useEffect(() => {
    if (phase !== "playing" || answered || busy || error) return;
    if (timeLeft <= 0) {
      void submit(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, answered, busy, error, timeLeft, submit]);

  // 1-4 tuşlarıyla cevap
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || answered || busy) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= (question?.options.length ?? 0)) {
        void submit(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answered, busy, question, submit]);

  // Cevaptan sonra kesinti yok: renkler kısa bir an görünür, sonraki soruya kendiliğinden geçilir.
  // Yanlışta biraz daha beklenir ki doğru şık (yeşil) görülebilsin.
  const goNextRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    if (phase !== "playing" || !result) return;
    const t = setTimeout(() => void goNextRef.current(), result.correct ? 1000 : 1600);
    return () => clearTimeout(t);
  }, [phase, result]);

  const won = opponent ? score > oppScore : total > 0 && correctCount / total >= 0.75;

  // Konfeti
  useEffect(() => {
    if (phase !== "done" || !won) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.35 },
        disableForReducedMotion: true,
        colors: ["#5b4cf0", "#ffbe3d", "#ff6b8b", "#13a08f", "#ffffff"],
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function begin() {
    setPhase("starting");
    setStartError(null);
    try {
      const res = await startQuiz(book.slug, opponent ? "duello" : "tek");
      if (!res.ok) {
        if (res.needLogin) return goLogin();
        setStartError(res.error);
        setPhase("intro");
        return;
      }
      setAttemptId(res.attemptId);
      setQuestions(res.questions);
    } catch {
      setStartError("Tur başlatılamadı. Bağlantını kontrol edip tekrar dene.");
      setPhase("intro");
      return;
    }
    setSummary(null);
    setIndex(0);
    setPicked(null);
    setResult(null);
    setGained(0);
    setScore(0);
    setCorrectCount(0);
    setOppScore(0);
    setHistory([]);
    setError(null);
    setTimeLeft(SECONDS);
    setPhase("playing");
  }

  // Düelloda tur kendiliğinden başlar (React geliştirme modunda iki kez çalışmasın).
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  goNextRef.current = goNext;
  async function goNext() {
    if (index + 1 >= total) {
      setPhase("done");
      window.scrollTo({ top: 0 });
      return;
    }
    if (!attemptId) return;
    setBusy(true);
    try {
      // Sürenin sunucuda başladığı an
      await nextQuestion(attemptId);
    } finally {
      setBusy(false);
    }
    setIndex((i) => i + 1);
    // Yeni soru en üstte: aşağıda kalındıysa yukarı dön.
    if (window.scrollY > 0) {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";
      window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
    }
    setPicked(null);
    setResult(null);
    setGained(0);
    setTimeLeft(SECONDS);
  }

  if (total === 0) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-2xl font-bold">Bu kitap için henüz soru yok.</p>
        <p className="mt-3 text-white/70">Başka bir kitap seçip tekrar deneyebilirsin.</p>
        <Link href="/meydan-okuma" className={cn(btnOnDark, "mt-8")}>
          Kitap listesine dön
        </Link>
      </div>
    );
  }

  /* ---------- Giriş ekranı ---------- */
  if (phase === "intro") {
    return (
      <div className="mx-auto grid w-full max-w-3xl items-center gap-10 py-6 sm:grid-cols-[200px_1fr]">
        <div className="mx-auto w-40 sm:w-full">
          <BookCover book={book} size="md" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{book.title}</h1>
          <p className="mt-2 text-white/70">{book.author}</p>
          {startError && (
            <p role="alert" className="mt-4 rounded-2xl bg-rose/20 px-4 py-3 text-sm font-semibold">
              {startError}
            </p>
          )}
          <ul className="mt-6 space-y-2 font-reading text-[17px] leading-7 text-white/85">
            <li>
              {total} soru, her biri için {SECONDS} saniye.
            </li>
            <li>Doğru cevap 100 puan; ne kadar hızlı cevaplarsan o kadar bonus.</li>
            <li>1–4 tuşlarıyla da cevap verebilirsin.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => void begin()} className={btnOnDark}>
              Başla
            </button>
            <Link href={`/kitaplar/${book.slug}`} className={btnGhostOnDark}>
              Önce özeti oku
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "starting") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center" role="status">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-gold" aria-hidden />
        <p className="font-semibold text-white/80">Sorular hazırlanıyor...</p>
      </div>
    );
  }

  /* ---------- Sonuç ekranı ---------- */
  if (phase === "done") {
    const perfect = correctCount === total;
    const ratio = correctCount / total;

    let headline: string;
    let detail: string;
    if (opponent) {
      if (score > oppScore) {
        headline = "Kazandın.";
        detail = `${opponent.name} ${oppScore} puanda kaldı.`;
      } else if (score < oppScore) {
        headline = "Bu sefer rakip önde bitirdi.";
        detail = `${opponent.name} ${oppScore} puan aldı. Rövanş için yeni bir düello aç.`;
      } else {
        headline = "Berabere.";
        detail = "İkiniz de aynı puanı aldınız.";
      }
    } else if (perfect) {
      headline = "Kusursuz.";
      detail = "Bütün soruları doğru cevapladın.";
    } else if (ratio >= 0.75) {
      headline = "Çok iyi.";
      detail = "Kitabı gayet iyi hatırlıyorsun.";
    } else if (ratio >= 0.5) {
      headline = "Fena değil.";
      detail = "Özeti bir kez daha okuyup tekrar deneyebilirsin.";
    } else {
      headline = "Bu kitap biraz zor geldi.";
      detail = "Özete göz atıp tekrar denemek iyi gelir.";
    }

    return (
      <div className="mx-auto w-full max-w-2xl py-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          {headline}
        </motion.p>
        <p className="mt-2 text-white/70">{detail}</p>

        <p className="mt-8 text-[88px] font-extrabold leading-none tabular-nums sm:text-[120px]">
          <CountUp to={score} />
        </p>
        <p className="mt-2 text-lg text-white/70">
          puan, {total} sorudan {correctCount} doğru
        </p>

        {summary && (
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.7 }}
            className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-1.5 font-extrabold text-[#26213f]"
          >
            <Sparkles size={16} aria-hidden /> +{summary.xpGained} XP hesabına eklendi
            {summary.streak > 1 && <span className="font-semibold">· {summary.streak} günlük seri</span>}
          </motion.p>
        )}

        {summary?.newBadges.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: 1 + i * 0.25 }}
            className="mx-auto mt-4 flex w-fit items-center gap-4 rounded-2xl bg-white/10 py-4 pl-4 pr-6 text-left"
          >
            <BadgeMedal badge={b} size={56} />
            <div>
              <p className="font-bold">Yeni rozet: {b.name}</p>
              <p className="text-sm text-white/70">{b.hint}</p>
            </div>
          </motion.div>
        ))}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {onExit ? (
            <button type="button" onClick={onExit} className={btnOnDark}>
              <RotateCcw size={18} aria-hidden /> Yeni düello
            </button>
          ) : (
            <button type="button" onClick={() => void begin()} className={btnOnDark}>
              <RotateCcw size={18} aria-hidden /> Tekrar dene
            </button>
          )}
          <Link href={`/kitaplar/${book.slug}`} className={btnGhostOnDark}>
            Kitaba dön
          </Link>
          <Link href="/siralama" className={btnGhostOnDark}>
            Sıralamayı gör
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Soru ekranı ---------- */
  const low = timeLeft <= 5;

  return (
    <div className={cn("mx-auto w-full max-w-3xl", error && "pb-32")}>
      {/* Sabit üst şerit: süre ve puan her zaman görünür, kaydırmaya gerek yok */}
      <div className="sticky top-16 z-20 -mx-5 bg-arena/90 px-5 pb-3 pt-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="truncate font-semibold">{book.title}</p>
          <div className="flex items-center gap-3">
            <ol className="flex gap-1.5" aria-hidden>
              {questions.map((q, i) => (
                <li
                  key={q.id}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    i === index ? "w-6 bg-white" : "w-2.5",
                    i < history.length && i !== index && (history[i] ? "bg-emerald-400" : "bg-rose"),
                    i > index && "bg-white/20",
                  )}
                />
              ))}
            </ol>
            <p className="tabular-nums text-white/70">
              {index + 1} / {total}
            </p>
          </div>
        </div>

        {opponent ? (
          <div className="mt-3 space-y-2 rounded-2xl bg-white/5 p-3">
            <ScoreRow name={settings.name} color={settings.color} icon={settings.icon} score={score} max={maxScore} />
            <ScoreRow name={opponent.name} color={opponent.color} icon={opponent.icon} score={oppScore} max={maxScore} />
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full transition-[width] duration-1000 ease-linear", low ? "bg-rose" : "bg-gold")}
              style={{ width: `${(timeLeft / SECONDS) * 100}%` }}
            />
          </div>
          <span
            className={cn("inline-flex w-14 items-center justify-end gap-1 text-sm font-semibold tabular-nums", low && !answered && "text-rose")}
            role="timer"
            aria-label={`${timeLeft} saniye kaldı`}
          >
            <Clock size={14} aria-hidden /> 0:{String(Math.max(timeLeft, 0)).padStart(2, "0")}
          </span>
          {!opponent && (
            <span className="relative inline-flex min-w-[5.5rem] justify-end text-lg font-extrabold tabular-nums">
              <motion.span key={score} initial={{ scale: 1.35, color: "#6ee7b7" }} animate={{ scale: 1, color: "#ffffff" }} transition={{ duration: 0.5 }}>
                {score}
              </motion.span>
              <span className="ml-1 self-end pb-0.5 text-xs font-semibold text-white/60">puan</span>
            </span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.22 }}
        >
          <h2 className="mt-5 text-balance text-2xl font-bold leading-tight sm:text-3xl">{question.text}</h2>

          <div className="mt-6 grid gap-3" role="group" aria-label="Cevap seçenekleri">
            {question.options.map((option, i) => {
              const isPicked = picked === i;
              const isCorrect = result?.correctIndex === i;
              const state = !result ? (isPicked ? "pending" : "idle") : isCorrect ? "correct" : isPicked ? "wrong" : "dim";

              return (
                <motion.button
                  key={option}
                  type="button"
                  disabled={busy || answered}
                  onClick={() => void submit(i)}
                  animate={state === "wrong" ? { x: [0, -9, 9, -6, 6, 0] } : state === "correct" && isPicked ? { scale: [1, 1.03, 1] } : { x: 0, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "relative flex items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left text-lg font-semibold transition-[color,background-color,border-color,opacity,translate] duration-150 enabled:hover:-translate-y-0.5",
                    state === "idle" && "border-white/15 bg-white/5 hover:border-white/50 hover:bg-white/10",
                    state === "pending" && "border-white bg-white/15",
                    state === "correct" && "border-emerald-400 bg-emerald-400/15",
                    state === "wrong" && "border-rose bg-rose/20",
                    state === "dim" && "border-white/10 bg-white/5 opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      state === "correct" ? "bg-emerald-400 text-arena" : state === "wrong" ? "bg-rose text-white" : "bg-white/10",
                    )}
                    aria-hidden
                  >
                    {state === "correct" ? <Check size={18} /> : state === "wrong" ? <X size={18} /> : state === "pending" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : LETTERS[i]}
                  </span>
                  <span className="flex-1">{option}</span>
                  {state === "correct" && isPicked && gained > 0 && (
                    <motion.span
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ opacity: [0, 1, 1, 0], y: -46 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="pointer-events-none absolute right-6 top-0 text-xl font-extrabold text-emerald-300"
                      aria-hidden
                    >
                      +{gained}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Sadece bağlantı hatasında: tekrar deneme */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-rose/60 bg-[#2a1030]/95 backdrop-blur-md"
            role="alert"
          >
            <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-5 py-4">
              <p className="flex-1 text-sm font-semibold">{error}</p>
              <button type="button" onClick={() => void submit(lastChoice.current)} className={btnOnDark}>
                <RotateCcw size={18} aria-hidden /> Tekrar dene
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}