"use server";

import { cleanName, isAvatarColor, isAvatarIcon } from "@/lib/settings";
import { mutate, newId } from "@/lib/server/db";
import { answerAttempt, openNextQuestion, startAttempt, type AnswerOutcome } from "@/lib/server/quiz";
import { consume } from "@/lib/server/rate-limit";
import { getCurrentUser } from "@/lib/server/users";
import { cleanText, ID_RE, SLUG_RE } from "@/lib/server/validate";
import type { Comment, PublicQuestion } from "@/lib/types";

/**
 * Herkese açık sunucu eylemleri. Bu dosyadaki her fonksiyon internetten
 * çağrılabilir bir uç noktadır; bu yüzden:
 * - quiz ve yorum eylemleri ÜYE oturumu ister (oturumu sunucu kontrol eder),
 * - her girdi tek tek doğrulanır,
 * - istek sayısı sınırlanır.
 */

const LOGIN_NEEDED = { ok: false as const, error: "Bunun için giriş yapmalısın.", needLogin: true as const };
const ATTEMPT_RE = /^t-[0-9a-f]{12}$/;

/* --------------------------------- Quiz --------------------------------- */

export type StartQuizResult =
  | { ok: true; attemptId: string; questions: PublicQuestion[] }
  | { ok: false; error: string; needLogin?: true };

export async function startQuiz(bookSlug: string, mode: "tek" | "duello"): Promise<StartQuizResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  if (typeof bookSlug !== "string" || !SLUG_RE.test(bookSlug) || (mode !== "tek" && mode !== "duello")) {
    return { ok: false, error: "Geçersiz istek." };
  }
  if (consume(`tur:${user.id}`, 40, 10 * 60_000).limited) {
    return { ok: false, error: "Çok fazla tur başlattın. Biraz mola ver :)" };
  }
  const started = await startAttempt(user.id, bookSlug, mode);
  if (!started) return { ok: false, error: "Bu kitap için soru bulunamadı." };
  return { ok: true, ...started };
}

/**
 * Cevap kontrolü ve puan SUNUCUDA. Tarayıcı sadece “şu soruya şu şıkkı
 * seçtim” der; süre sunucu saatiyle ölçülür, puanı sunucu hesaplar.
 * choice = -1 → süre doldu.
 */
export async function answerQuestion(
  attemptId: string,
  questionId: string,
  choice: number,
): Promise<AnswerOutcome | typeof LOGIN_NEEDED> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  if (
    typeof attemptId !== "string" || !ATTEMPT_RE.test(attemptId) ||
    typeof questionId !== "string" || !ID_RE.test(questionId) ||
    !Number.isInteger(choice) || choice < -1 || choice > 3
  ) {
    return { ok: false, error: "Geçersiz istek." };
  }
  if (consume(`cevap:${user.id}`, 120, 60_000).limited) {
    return { ok: false, error: "Çok hızlı istek gönderildi." };
  }
  return answerAttempt(user.id, attemptId, questionId, choice);
}

export async function nextQuestion(attemptId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || typeof attemptId !== "string" || !ATTEMPT_RE.test(attemptId)) return { ok: false };
  return { ok: await openNextQuestion(user.id, attemptId) };
}

/* -------------------------------- Yorumlar -------------------------------- */

export type PostCommentResult = { ok: true; comment: Comment } | { ok: false; error: string; needLogin?: true };

/** Yazarın adı, rengi ve simgesi tarayıcıdan DEĞİL, oturumdaki hesaptan alınır. */
export async function postComment(input: { bookSlug: string; text: string }): Promise<PostCommentResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  if (!input || typeof input !== "object") return { ok: false, error: "Geçersiz istek." };

  const bookSlug = typeof input.bookSlug === "string" ? input.bookSlug : "";
  if (!SLUG_RE.test(bookSlug) || bookSlug.length > 60) return { ok: false, error: "Kitap bulunamadı." };

  const text = cleanText(typeof input.text === "string" ? input.text.slice(0, 2000) : "", { multiline: true });
  if (text.length < 2) return { ok: false, error: "Yorumun biraz kısa kaldı." };
  if (text.length > 500) return { ok: false, error: "Yorum en fazla 500 karakter olabilir." };

  const perUser = consume(`yorum:${user.id}`, 5, 10 * 60_000);
  const global = consume("yorum:hepsi", 120, 10 * 60_000);
  if (perUser.limited || global.limited) {
    const minutes = Math.ceil(Math.max(perUser.retryAfterMs, global.retryAfterMs) / 60_000);
    return { ok: false, error: `Biraz yavaşla :) ${minutes} dakika sonra tekrar yorum yazabilirsin.` };
  }

  const comment: Comment = {
    id: newId("y"),
    bookSlug,
    author: user.displayName,
    color: user.color,
    icon: user.icon,
    text,
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  const saved = await mutate((d) => {
    if (!d.books.some((b) => b.slug === bookSlug)) return false;
    d.comments.push({ ...comment, userId: user.id });
    // 10. yorumda "Sohbet ustası" rozeti
    const u = d.users.find((x) => x.id === user.id);
    if (u && !u.badges.includes("sohbet-ustasi") && d.comments.filter((c) => c.userId === user.id).length >= 10) {
      u.badges.push("sohbet-ustasi");
    }
    return true;
  });
  if (!saved) return { ok: false, error: "Kitap bulunamadı." };

  return { ok: true, comment };
}

/* --------------------------------- Profil --------------------------------- */

export type ProfileResult = { ok: true } | { ok: false; error: string; needLogin?: true };

export async function updateProfile(input: { displayName?: string; color?: string; icon?: string }): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  if (!input || typeof input !== "object") return { ok: false, error: "Geçersiz istek." };
  if (consume(`profil:${user.id}`, 60, 10 * 60_000).limited) return { ok: false, error: "Çok sık değişiklik yapıldı." };

  const patch: { displayName?: string; color?: string; icon?: (typeof user)["icon"] } = {};
  if (input.displayName !== undefined) {
    const name = cleanName(input.displayName);
    if (!name) return { ok: false, error: "Görünen ad 2-24 karakter olmalı; harf, rakam, boşluk ve . _ - kullanılabilir." };
    patch.displayName = name;
  }
  if (input.color !== undefined) {
    if (!isAvatarColor(input.color)) return { ok: false, error: "Geçersiz renk." };
    patch.color = input.color;
  }
  if (input.icon !== undefined) {
    if (!isAvatarIcon(input.icon)) return { ok: false, error: "Geçersiz simge." };
    patch.icon = input.icon;
  }

  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (u) Object.assign(u, patch);
  });
  return { ok: true };
}
