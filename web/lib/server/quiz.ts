import "server-only";
import { badges as allBadges } from "@/lib/data/badges";
import type { Badge, PublicQuestion } from "@/lib/types";
import { mutate, newId } from "./db";
import { dayKey, weekKey } from "./users";

/**
 * Meydan okuma turları SUNUCUDA yürütülür:
 * - Süre sunucu saatiyle ölçülür (tarayıcıdaki sayaç sadece gösterimdir).
 * - Puan sunucuda hesaplanır; tarayıcı puan gönderemez.
 * - Her soru bir kez cevaplanır, sıra atlanamaz, aynı soru iki kez puanlanmaz.
 * - Tur bitince XP, seri ve rozetler üyenin hesabına yazılır.
 */

export const QUIZ_SECONDS = 20;
const GRACE_MS = 1500; // ağ gecikmesi payı
const XP_DIVISOR = 4;

function toPublic(q: PublicQuestion): PublicQuestion {
  return { id: q.id, bookSlug: q.bookSlug, text: q.text, options: [...q.options] };
}

export async function startAttempt(userId: string, bookSlug: string, mode: "tek" | "duello") {
  const now = Date.now();
  return mutate((d) => {
    // Eski turları temizle: bitmiş olanlar 1 gün, yarım kalanlar 2 saat sonra silinir.
    d.quizAttempts = d.quizAttempts.filter((a) =>
      a.finishedAt ? now - a.finishedAt < 86_400_000 : now - a.createdAt < 7_200_000,
    );
    if (d.quizAttempts.length > 5000) d.quizAttempts.splice(0, d.quizAttempts.length - 5000);

    if (!d.books.some((b) => b.slug === bookSlug)) return null;
    const questions = d.questions.filter((q) => q.bookSlug === bookSlug);
    if (questions.length === 0) return null;

    const attempt = {
      id: newId("t"),
      userId,
      bookSlug,
      mode,
      questionIds: questions.map((q) => q.id),
      index: 0,
      askedAt: now,
      score: 0,
      correctCount: 0,
      fastCorrect: false,
      createdAt: now,
      finishedAt: null,
    };
    d.quizAttempts.push(attempt);
    return { attemptId: attempt.id, questions: questions.map(toPublic) };
  });
}

export type FinishSummary = { xpGained: number; totalXp: number; streak: number; newBadges: Badge[] };

export type AnswerOutcome =
  | { ok: false; error: string }
  | {
      ok: true;
      correct: boolean;
      correctIndex: number;
      explanation: string;
      points: number;
      score: number;
      done: boolean;
      summary?: FinishSummary;
    };

export async function answerAttempt(userId: string, attemptId: string, questionId: string, choice: number): Promise<AnswerOutcome> {
  const now = Date.now();
  return mutate((d): AnswerOutcome => {
    const a = d.quizAttempts.find((x) => x.id === attemptId && x.userId === userId);
    if (!a || a.finishedAt) return { ok: false, error: "Bu tur bitmiş ya da bulunamadı." };
    if (a.askedAt === null) return { ok: false, error: "Bu soru zaten cevaplandı." };
    if (a.questionIds[a.index] !== questionId) return { ok: false, error: "Soru sırası uyuşmuyor." };

    const q = d.questions.find((x) => x.id === questionId);
    if (!q) return { ok: false, error: "Soru bulunamadı." };

    const elapsed = now - a.askedAt;
    const timedOut = choice === -1 || elapsed > QUIZ_SECONDS * 1000 + GRACE_MS;
    const correct = !timedOut && choice === q.correct;
    const secondsLeft = Math.max(0, QUIZ_SECONDS - Math.floor(Math.max(0, elapsed - GRACE_MS) / 1000));
    const points = correct ? 100 + secondsLeft * 2 : 0;

    a.score += points;
    if (correct) a.correctCount += 1;
    if (correct && elapsed <= 5000 + GRACE_MS) a.fastCorrect = true;
    a.index += 1;
    a.askedAt = null;

    const done = a.index >= a.questionIds.length;
    let summary: FinishSummary | undefined;

    if (done) {
      a.finishedAt = now;
      const user = d.users.find((u) => u.id === userId);
      if (user) {
        const xpGained = Math.round(a.score / XP_DIVISOR);
        const wk = weekKey(now);
        if (user.weekKey !== wk) {
          user.weekKey = wk;
          user.weeklyXp = 0;
        }
        user.xp += xpGained;
        user.weeklyXp += xpGained;
        user.quizzesCompleted += 1;

        const today = dayKey(now);
        const yesterday = dayKey(now - 86_400_000);
        if (user.lastPlayedDay !== today) {
          user.streak = user.lastPlayedDay === yesterday ? user.streak + 1 : 1;
          user.lastPlayedDay = today;
        }

        // Arkadaşların görebileceği kısa okuma geçmişi (kişi başı son 20 kayıt).
        d.activity.push({
          id: newId("a"),
          userId,
          type: "quiz",
          bookSlug: a.bookSlug,
          correctCount: a.correctCount,
          total: a.questionIds.length,
          xpGained,
          at: now,
        });
        const mine = d.activity.filter((x) => x.userId === userId);
        if (mine.length > 20) {
          const drop = new Set(mine.slice(0, mine.length - 20).map((x) => x.id));
          d.activity = d.activity.filter((x) => !drop.has(x.id));
        }

        const category = d.books.find((b) => b.slug === a.bookSlug)?.category;
        if (category && !user.categoriesPlayed.includes(category)) user.categoriesPlayed.push(category);

        const earned = new Set(user.badges);
        const newBadges: string[] = [];
        const give = (id: string, cond: boolean) => {
          if (cond && !earned.has(id)) {
            user.badges.push(id);
            earned.add(id);
            newBadges.push(id);
          }
        };
        give("ilk-sayfa", true);
        give("kusursuz", a.correctCount === a.questionIds.length);
        give("hiz-treni", a.fastCorrect);
        give("duellocu", a.mode === "duello");
        give("gezgin", user.categoriesPlayed.length >= 4);
        give("alev-alev", user.streak >= 7);

        summary = {
          xpGained,
          totalXp: user.xp,
          streak: user.streak,
          newBadges: allBadges.filter((b) => newBadges.includes(b.id)).map((b) => ({ ...b, earned: true })),
        };
      }
    }

    return { ok: true, correct, correctIndex: q.correct, explanation: q.explanation, points, score: a.score, done, summary };
  });
}

/** "Sonraki soru"ya basıldığında sürenin sunucuda başladığı an. */
export async function openNextQuestion(userId: string, attemptId: string) {
  const now = Date.now();
  return mutate((d) => {
    const a = d.quizAttempts.find((x) => x.id === attemptId && x.userId === userId);
    if (!a || a.finishedAt || a.index >= a.questionIds.length) return false;
    if (a.askedAt === null) a.askedAt = now;
    return true;
  });
}
